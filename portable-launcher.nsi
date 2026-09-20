; ZyperCode True Single-File Portable Executable
Unicode true
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
SetCompressor /SOLID lzma

Name "ZyperCode"
!ifndef OUTFILE
  !define OUTFILE "C:\Users\Sarvadnya\Downloads\ZyperCode\Final exe's\zypercode-v0.0.4-beta-standalone.exe"
!endif
OutFile "${OUTFILE}"
Icon "C:\Users\Sarvadnya\Downloads\ZyperCode\terax-ai-main\src-tauri\icons\icon.ico"

Section
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File "C:\Users\Sarvadnya\Downloads\ZyperCode\terax-ai-main\src-tauri\target\x86_64-pc-windows-gnu\release\ZyperCode.exe"
  File "C:\Users\Sarvadnya\Downloads\ZyperCode\terax-ai-main\src-tauri\target\x86_64-pc-windows-gnu\release\WebView2Loader.dll"
  ExecWait '"$PLUGINSDIR\ZyperCode.exe"'
SectionEnd
