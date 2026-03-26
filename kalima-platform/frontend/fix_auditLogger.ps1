$al = Get-Content 'e:\GitHub\fekra\kalima-platform\backend\middleware\auditLogger.js' -Raw
$al = $al -replace 'if \(resData && !specialResource\) \{\r?\n\s*\}\r?\n\s*// For other resource types\r?\n\s*else if', 'if (resData && !specialResource) {
    // For other resource types
    if'
Set-Content 'e:\GitHub\fekra\kalima-platform\backend\middleware\auditLogger.js' -Value $al
