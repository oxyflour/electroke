mkdir bin
copy build\Release\*.node bin\ /Y
rmdir /s /q build\
move bin build
asar pack . build\app.asar
