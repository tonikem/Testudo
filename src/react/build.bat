xcopy /s "dist\assets\index.html" "..\flask\templates\"
copy /y "dist\assets\static\*.css" "..\flask\static\"
copy /y "dist\assets\static\*.js" "..\flask\static\"