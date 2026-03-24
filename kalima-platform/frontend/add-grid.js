const fs = require('fs');
let code = fs.readFileSync('src/pages/signup/StepParent.jsx', 'utf8');

const splitTarget = "<p className=\"text-lg font-semibold\">{t('form.parentDetails')}</p>";
const parts = code.split(splitTarget);

if (parts.length > 1) {
    let bottom = parts[1];
    
    const childrenTarget = "{/* Children IDs Section */}";
    const bottomParts = bottom.split(childrenTarget);
    
    if (bottomParts.length > 1) {
        let beforeChildren = bottomParts[0];
        let afterChildren = bottomParts[1];
        
        parts[1] = '\n            <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1\">' + beforeChildren + '\n            </div>\n            ' + childrenTarget + afterChildren;
        
        code = parts.join("<p className=\"text-xl sm:text-2xl font-semibold mb-2\">{t('form.parentDetails')}</p>");
    } 
}

fs.writeFileSync('src/pages/signup/StepParent.jsx', code);
