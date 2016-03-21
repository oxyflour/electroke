#include <node.h>
#include <v8.h>
#include <nan.h>

#include <map>
#include <vector>

#include <windows.h>
#include <winuser.h>
#include <Shlwapi.h>
#include <Psapi.h>

using v8::FunctionCallbackInfo;
using v8::Value;
using v8::Isolate;
using v8::Local;
using v8::Function;
using v8::Object;
using v8::String;
using v8::Boolean;
using v8::Number;
using v8::Persistent;

using node::AtExit;

using std::map;
using std::vector;
using std::string;

using Nan::Utf8String;

#define ABS(x) ((x > 0) ? (x) : -(x))

// https://github.com/gerhardberger/addon-emitter/blob/master/emitter.h
using CP = Nan::CopyablePersistentTraits<Function>::CopyablePersistent;

struct EVT {
	WPARAM msg;
	POINT pt;
};

struct HOOK_INFO {
	DWORD pid;
	uv_async_t async;
	map<string, vector<CP>> callbacks;
	vector<EVT> events;
} info;

struct MOUSE_STATUS {
	BOOL isDown;
	BOOL isEnabled;
} status;

map<WPARAM, string> EVENT_NAMES = {
	{ WM_MOUSEMOVE,		"mousemove" },
	{ WM_RBUTTONDOWN,	"mousedown" },
	{ WM_RBUTTONUP, 	"mouseup" },
};

map<string, bool> DISABLED_CONDS = {
	// something like
	//{ "cls:ConsoleWindowClass", true },
	//{ "exe:electron.exe", true },
};

BOOL IsEnabledAtPosition(POINT &pt) {
	char szBuf[256];
	if (DISABLED_CONDS.find("*") != DISABLED_CONDS.end())
		return false;

	HWND hWnd = WindowFromPoint(pt);
	GetClassName(hWnd, szBuf, sizeof(szBuf));
	string cls = string("cls:") + szBuf;
	if (DISABLED_CONDS.find(cls) != DISABLED_CONDS.end())
		return false;

	// http://stackoverflow.com/questions/2397578/how-to-get-the-executable-name-of-a-window
	DWORD threadId;
	GetWindowThreadProcessId(hWnd, &threadId);
	HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, threadId);
	GetModuleFileNameEx(hProcess, NULL, szBuf, sizeof(szBuf));
	CloseHandle(hProcess);
	string exe = string("exe:") + PathFindFileName(szBuf);
	if (DISABLED_CONDS.find(exe) != DISABLED_CONDS.end())
		return false;

	return true;
}

LRESULT CALLBACK HookProc(int nCode, WPARAM wParam, LPARAM lParam) {
	// https://msdn.microsoft.com/en-us/library/windows/desktop/ms644959(v=vs.85).aspx
	if (nCode != HC_ACTION)
		return CallNextHookEx(0, nCode, wParam, lParam);
	
	auto &hs = *((MSLLHOOKSTRUCT *) lParam);
	// ignore injected events from SimulateMouse
	if (hs.dwExtraInfo & LLMHF_INJECTED)
		return CallNextHookEx(0, nCode, wParam, lParam);

	// check if gesture should be enabled
	if (wParam == WM_RBUTTONDOWN)
		status.isEnabled = IsEnabledAtPosition(hs.pt);

	// only WM_RBUTTONDOWN, WM_RBUTTONUP, WM_MOUSEMOVE will be posted
	if (status.isEnabled &&
			(wParam == WM_RBUTTONDOWN || wParam == WM_RBUTTONUP ||
				(wParam == WM_MOUSEMOVE && status.isDown))) {

		info.events.push_back({ wParam, hs.pt });
		uv_async_send(&info.async);

		if (wParam == WM_RBUTTONDOWN || wParam == WM_RBUTTONUP) {
			status.isDown = wParam == WM_RBUTTONDOWN;
			return 1;
		}
	}

	return CallNextHookEx(0, nCode, wParam, lParam);
}

void on(const FunctionCallbackInfo<Value>& args) {
	auto &cbs = info.callbacks[*Utf8String(args[0])];
	auto func = Local<Function>::Cast(args[1]);
	auto &find = std::find_if(cbs.begin(), cbs.end(),
		[&](const CP &m) -> bool { return m == func; });
	if (find == cbs.end())
		cbs.push_back(CP(args.GetIsolate(), func));
}

void off(const FunctionCallbackInfo<Value>& args) {
	auto &cbs = info.callbacks[*Utf8String(args[0])];
	auto func = Local<Function>::Cast(args[1]);
	auto &find = std::find_if(cbs.begin(), cbs.end(),
		[&](const CP &m) -> bool { return m == func; });
	if (find != cbs.end())
		cbs.erase(find);
}

void enable(const FunctionCallbackInfo<Value>& args) {
	auto prog = *Utf8String(args[0]);
	DISABLED_CONDS.erase(prog);
}

void disable(const FunctionCallbackInfo<Value>& args) {
	auto prog = *Utf8String(args[0]);
	DISABLED_CONDS[prog] = true;
}

void fire(uv_async_t *handle) {
	if (info.events.empty())
		return;

	// clone the events to keep thread-safety
	auto events = info.events;
	info.events.clear();

	Isolate* isolate = Isolate::GetCurrent();
	v8::HandleScope scope(isolate);
	auto null = Null(isolate);
	for (auto const &e : events) {
		Local<Value> args[] = {
			v8::Number::New(isolate, (int) e.pt.x),
			v8::Number::New(isolate, (int) e.pt.y),
		};
		int argc = sizeof(args) / sizeof(args[0]);
		auto &name = EVENT_NAMES[e.msg];
		auto &cbs = info.callbacks[name];
		for (auto const &cb : cbs)
			Local<Function>::New(isolate, cb)->Call(null, argc, args);
	}
}

void clean(void *pdata) {
	for (auto &cbs : info.callbacks)
		for (auto &cb : cbs.second)
			cb.Reset();
	info.pid = 0;
}

// a message loop is required for _LL hooks
// this will be executed in a new thread
void hook(void *arg) {
	HMODULE hModule;
	GetModuleHandleEx(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS, (char *) HookProc, &hModule);
	HHOOK hook = SetWindowsHookEx(WH_MOUSE_LL, HookProc, hModule, 0);

	HWND hWnd = CreateWindow("STATIC", "MESSAGE_WINDOW", 0,
		0, 0, 0, 0,
		HWND_MESSAGE, NULL, hModule, NULL);
	MSG msg;
	while (GetMessage(&msg, NULL, 0, 0) && info.pid > 0) {
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}

	if (hook > 0)
		UnhookWindowsHookEx(hook);
}

void init(Local<Object> target) {
	if (info.pid > 0 && info.pid != GetCurrentProcessId())
		throw "this module should only be required once in one process";

	info.pid = GetCurrentProcessId();
	uv_thread_t thread;
	uv_thread_create(&thread, hook, NULL);
	uv_async_init(uv_default_loop(), &info.async, fire);

	AtExit(clean, &info);

	NODE_SET_METHOD(target, "on", on);
	NODE_SET_METHOD(target, "off", off);
	NODE_SET_METHOD(target, "enable", enable);
	NODE_SET_METHOD(target, "disable", disable);
}

NODE_MODULE(hook, init);