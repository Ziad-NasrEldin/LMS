
const fs = require('fs');

const loginEns = {
    'loginHeroTitle': 'Grow Your Mind',
    'loginHeroTitle2': 'with Fekra',
    'loginHeroSub': 'Join thousands of students and educators in a playful, structured learning environment designed for growth.',
    'welcomeBack': 'Welcome Back!',
    'welcomeSubtitle': 'Ready to continue your learning journey?',
    'continueWith': 'Or continue with',
    'tipTitle': 'Daily Learning Tip',
    'tipBody': 'Log in daily to keep your streak and unlock growth badges faster.',
    'register': 'Sign Up'
};

const loginArs = {
    'loginHeroTitle': 'طور عقلك',
    'loginHeroTitle2': 'مع فكرة',
    'loginHeroSub': 'انضم إلى آلاف الطلاب والمعلمين في بيئة تعليمية ممتعة ومنظمة ومصممة للنمو.',
    'welcomeBack': 'مرحباً بعودتك!',
    'welcomeSubtitle': 'هل أنت مستعد لمواصلة رحلتك التعليمية؟',
    'continueWith': 'أو المتابعة باستخدام',
    'tipTitle': 'نصيحة تعليمية يومية',
    'tipBody': 'سجل الدخول يومياً للحفاظ على سلسلتك وفتح شارات النمو بشكل أسرع.',
    'register': 'سجل الآن'
};

for (const lang of ['en', 'ar']) {
    const p = \public/locales/\/login.json\;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    Object.assign(data, lang === 'en' ? loginEns : loginArs);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

console.log('Login translations updated.');

