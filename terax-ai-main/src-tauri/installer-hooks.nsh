; Setup branding & messages matching setupscreenlikethis.html
!define MUI_WELCOMEPAGE_TITLE "Welcome to ZyperCode"
!define MUI_WELCOMEPAGE_TEXT "This installs the editor, the extension host, and the command-line launcher.$\r$\n$\r$\nSetup takes about a minute and stays inside its own folder.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_TITLE "ZyperCode Installed"
!define MUI_FINISHPAGE_TEXT "ZyperCode has been installed on your system.$\r$\n$\r$\nClick Finish to launch ZyperCode."

; "Open in ZyperCode" shell verbs for folders, folder backgrounds, and drives.
; HKCU matches installer currentUser scope. %V = clicked path.
; NoWorkingDirectory keeps Explorer from overriding %V (System32 on Drive).

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInZyperCode" "" "Open in ZyperCode"
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInZyperCode" "Icon" '"$INSTDIR\ZyperCode.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInZyperCode" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInZyperCode\command" "" '"$INSTDIR\ZyperCode.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInZyperCode" "" "Open in ZyperCode"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInZyperCode" "Icon" '"$INSTDIR\ZyperCode.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInZyperCode" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInZyperCode\command" "" '"$INSTDIR\ZyperCode.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInZyperCode" "" "Open in ZyperCode"
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInZyperCode" "Icon" '"$INSTDIR\ZyperCode.exe",0'
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInZyperCode" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInZyperCode\command" "" '"$INSTDIR\ZyperCode.exe" "%V"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Directory\shell\OpenInZyperCode"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\OpenInZyperCode"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\OpenInZyperCode"
!macroend
