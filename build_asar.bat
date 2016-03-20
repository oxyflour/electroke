mkdir bin
copy build\Release\*.node bin\ /Y
rmdir /s /q build
mkdir build
move bin build\Release
asar pack . build\app.asar
