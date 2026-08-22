Option Explicit

Dim shell, runner, powershell, command, exitCode

If WScript.Arguments.Count <> 1 Then
  WScript.Quit 2
End If

runner = WScript.Arguments(0)
powershell = CreateObject("WScript.Shell").ExpandEnvironmentStrings("%SystemRoot%") & _
  "\System32\WindowsPowerShell\v1.0\powershell.exe"
command = """" & powershell & """ -NoProfile -ExecutionPolicy Bypass -File """ & runner & """"

Set shell = CreateObject("WScript.Shell")
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode
