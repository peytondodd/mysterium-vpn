RequestExecutionLevel admin

!macro deleteMysteriumClient
    ExecWait 'sc.exe stop MysteriumClient'
    ExecWait 'sc.exe delete MysteriumClient'
    ExecWait 'reg delete HKLM\SYSTEM\CurrentControlSet\Services\EventLog\Application\MysteriumClient /f'
!macroend

!macro customInit
    !insertmacro deleteMysteriumClient
!macroend

!macro customUnInstall
    !insertmacro deleteMysteriumClient
!macroend
