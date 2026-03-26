$al = Get-Content 'e:\GitHub\fekra\kalima-platform\backend\middleware\auditLogger.js' -Raw
$al = $al -replace '(?s)// Special case for packages which have a different structure.*?else if \(resData\.packages && resData\.packages\.length\) \{.*?\}.*?\}', ''
Set-Content 'e:\GitHub\fekra\kalima-platform\backend\middleware\auditLogger.js' -Value $al

$alc = Get-Content 'e:\GitHub\fekra\kalima-platform\backend\controllers\auditLogController.js' -Raw
$alc = $alc -replace '(?s)case "package": \{.*?name: "Deleted Package" \};\s*\}', ''
Set-Content 'e:\GitHub\fekra\kalima-platform\backend\controllers\auditLogController.js' -Value $alc
