# إعداد أيقونات التطبيق لـ iOS App Store

## الأيقونة الرئيسية
تم إنشاء أيقونة التطبيق في: `public/app-icons/icon-1024.png`

## خطوات إضافة الأيقونات في Xcode

### الطريقة 1: استخدام Asset Catalog (موصى بها)

1. **افتح المشروع في Xcode:**
   ```bash
   npx cap open ios
   ```

2. **انتقل إلى Assets:**
   - في Xcode، اذهب إلى: `App > App > Assets`
   - انقر على `AppIcon`

3. **أضف الأيقونة الرئيسية:**
   - اسحب ملف `icon-1024.png` إلى خانة `App Store Icon (1024x1024)`
   - Xcode سيقوم تلقائياً بإنشاء باقي الأحجام

### الطريقة 2: استخدام أداة App Icon Generator

1. **استخدم موقع لتوليد الأيقونات:**
   - اذهب إلى [App Icon Generator](https://appicon.co/) أو [MakeAppIcon](https://makeappicon.com/)
   - ارفع ملف `icon-1024.png`
   - حمّل الأيقونات بجميع الأحجام

2. **أحجام iOS المطلوبة:**
   | الحجم | الاستخدام |
   |-------|-----------|
   | 20x20 | iPhone Notification (2x=40, 3x=60) |
   | 29x29 | iPhone Settings (2x=58, 3x=87) |
   | 40x40 | iPhone Spotlight (2x=80, 3x=120) |
   | 60x60 | iPhone App (2x=120, 3x=180) |
   | 76x76 | iPad App (1x=76, 2x=152) |
   | 83.5x83.5 | iPad Pro App (2x=167) |
   | 1024x1024 | App Store |

3. **استبدل محتويات مجلد AppIcon.appiconset:**
   ```
   ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```

## ملاحظات مهمة

- **لا تستخدم الشفافية:** أيقونات iOS يجب أن تكون بخلفية صلبة
- **بدون زوايا مدورة:** iOS يضيف الزوايا المدورة تلقائياً
- **جودة عالية:** استخدم PNG بدون ضغط

## التحقق من الأيقونات

بعد إضافة الأيقونات، قم بـ:
1. Clean Build: `Product > Clean Build Folder`
2. Build: `Product > Build`
3. تحقق من ظهور الأيقونة في Simulator

## موارد مفيدة

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [App Icon Generator](https://appicon.co/)
