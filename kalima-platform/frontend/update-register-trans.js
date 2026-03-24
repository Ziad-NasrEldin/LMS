
const fs = require('fs');

const enKeys = {
    'alreadyHaveAccount': 'Already have an account?',
    'login': 'Login',
    'signupHeroStart': 'Start your',
    'signupHeroMiddle': 'learning',
    'signupHeroEnd': 'journey today.',
    'signupHeroSub': 'Join thousands of students and educators in a playful, structured learning environment designed for growth.',
    'interactiveLessons': 'Interactive Lessons',
    'progress': 'Progress',
    'earnBadges': 'Earn badges while you learn!',
    'createAccount': 'Create Account',
    'createAccountSub': 'Choose your role and fill in your details.',
    'iAmA': 'I am a',
    'student': 'Student',
    'parent': 'Parent',
    'teacher': 'Teacher'
};

const arKeys = {
    'alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'login': 'تسجيل الدخول',
    'signupHeroStart': 'ابدأ رحلة',
    'signupHeroMiddle': 'التعلم',
    'signupHeroEnd': 'اليوم.',
    'signupHeroSub': 'انضم إلى آلاف الطلاب والمعلمين في بيئة تعليمية ممتعة ومنظمة ومصممة للنمو.',
    'interactiveLessons': 'دروس تفاعلية',
    'progress': 'التقدم',
    'earnBadges': 'اكسب شارات أثناء التعلم!',
    'createAccount': 'إنشاء حساب',
    'createAccountSub': 'اختر دورك واملأ بياناتك.',
    'iAmA': 'أنا...',
    'student': 'طالب',
    'parent': 'ولي أمر',
    'teacher': 'معلم'
};

for (const lang of ['en', 'ar']) {
    const p = \public/locales/\/register.json\;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    Object.assign(data, lang === 'en' ? enKeys : arKeys);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

console.log('Register translations updated.');

