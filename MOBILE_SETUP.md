# إعداد تطبيق الموبايل - NutriChem Analyzer

## الخطوة 1: تصدير المشروع إلى GitHub
1. اضغط على زر "Export to GitHub" في أعلى يمين الصفحة
2. قم بعمل Git pull للمشروع من مستودع GitHub الخاص بك

## الخطوة 2: تثبيت المتطلبات
```bash
npm install
```

## الخطوة 3: تهيئة Capacitor
```bash
npx cap init
```

سيطلب منك:
- App name: nutrichem-arabic-analyzer (اضغط Enter - القيمة الافتراضية)
- App ID: app.lovable.07c64b4dd8ce4268a048383feb448665 (اضغط Enter - القيمة الافتراضية)

## الخطوة 4: إضافة المنصات

### لنظام Android:
```bash
npx cap add android
npx cap update android
```

متطلبات Android:
- تثبيت Android Studio
- Java Development Kit (JDK) 11 أو أحدث

### لنظام iOS (على Mac فقط):
```bash
npx cap add ios
npx cap update ios
```

متطلبات iOS:
- جهاز Mac
- تثبيت Xcode
- حساب Apple Developer (للنشر في App Store)

## الخطوة 5: بناء المشروع
```bash
npm run build
```

## الخطوة 6: مزامنة المشروع
```bash
npx cap sync
```

## الخطوة 7: تشغيل التطبيق

### على Android:
```bash
npx cap run android
```
أو افتح المشروع في Android Studio:
```bash
npx cap open android
```

### على iOS:
```bash
npx cap run ios
```
أو افتح المشروع في Xcode:
```bash
npx cap open ios
```

## ملاحظات مهمة

### أذونات الكاميرا

#### Android (android/app/src/main/AndroidManifest.xml):
أضف هذا السطر داخل `<manifest>`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

#### iOS (ios/App/App/Info.plist):
أضف هذه الأسطر:
```xml
<key>NSCameraUsageDescription</key>
<string>نحتاج للوصول إلى الكاميرا لمسح الباركود</string>
```

### التحديثات المستقبلية
بعد أي تغيير في الكود:
1. قم بعمل Git pull
2. قم بتشغيل `npm run build`
3. قم بتشغيل `npx cap sync`

### استخدام Hot Reload
التطبيق حالياً يستخدم Hot Reload من Lovable Sandbox. لتعطيله:
1. افتح `capacitor.config.ts`
2. احذف قسم `server`
3. قم بتشغيل `npm run build && npx cap sync`

## المساعدة والدعم
- [وثائق Capacitor الرسمية](https://capacitorjs.com/docs)
- [وثائق Lovable](https://docs.lovable.dev/)
- [مدونة Lovable عن Capacitor](https://lovable.dev/blog)
