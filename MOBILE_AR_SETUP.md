# إعداد تطبيق الواقع المعزز للموبايل

## نظرة عامة
تم إضافة ميزة الواقع المعزز (AR) للتطبيق باستخدام Capacitor لإنشاء تطبيق موبايل نيتف حقيقي يعمل على iOS و Android.

## المتطلبات الأساسية

### لتطوير iOS:
- Mac مع macOS 12 أو أحدث
- Xcode 14 أو أحدث
- CocoaPods (`sudo gem install cocoapods`)
- حساب Apple Developer (للنشر على App Store)

### لتطوير Android:
- Android Studio (أحدث إصدار)
- Android SDK 24 أو أحدث
- JDK 11 أو أحدث

## خطوات الإعداد

### 1. تصدير المشروع إلى GitHub
1. اضغط على زر "Export to Github" في Lovable
2. قم بإنشاء مستودع جديد على GitHub
3. سيتم نقل كود المشروع تلقائياً

### 2. استنساخ المشروع محلياً
```bash
git clone <your-github-repo-url>
cd <project-name>
```

### 3. تثبيت المتطلبات
```bash
npm install
```

### 4. إضافة المنصات
```bash
# لإضافة iOS
npx cap add ios

# لإضافة Android
npx cap add android
```

### 5. تحديث المكونات النيتف
```bash
# لـ iOS
npx cap update ios

# لـ Android
npx cap update android
```

### 6. بناء التطبيق
```bash
npm run build
```

### 7. مزامنة التغييرات
```bash
npx cap sync
```

## تشغيل التطبيق

### على iOS:
```bash
npx cap run ios
```
سيفتح Xcode تلقائياً. اختر محاكي أو جهاز حقيقي وشغل التطبيق.

### على Android:
```bash
npx cap run android
```
سيفتح Android Studio تلقائياً. اختر محاكي أو جهاز حقيقي وشغل التطبيق.

## إضافة قدرات AR المتقدمة

### لـ iOS (ARKit):
1. افتح المشروع في Xcode
2. اذهب إلى Target → Signing & Capabilities
3. أضف "Camera" في Info.plist:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>نحتاج للوصول للكاميرا لعرض تأثيرات الواقع المعزز</string>
   ```

### لـ Android (ARCore):
1. أضف في `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera.ar" android:required="true"/>
   
   <application>
     <meta-data android:name="com.google.ar.core" android:value="required" />
   </application>
   ```

2. أضف ARCore dependency في `android/app/build.gradle`:
   ```gradle
   dependencies {
     implementation 'com.google.ar:core:1.40.0'
   }
   ```

## ميزات AR المتوفرة

1. **عرض النموذج ثلاثي الأبعاد على الكاميرا الحية**
   - يعرض نموذج الجسم فوق فيديو الكاميرا
   - يمكن التحكم في موضع وحجم النموذج

2. **جسيمات نانوية متحركة**
   - تظهر الجسيمات الحمراء للمكونات السلبية
   - تظهر الجسيمات الخضراء للمكونات الإيجابية
   - تتحرك من نقطة التطبيق إلى الأعضاء المتأثرة

3. **معلومات تفاعلية**
   - النقر على أي عضو يعرض تفاصيل التأثيرات
   - قائمة بالمواد المؤثرة
   - نصائح للاستخدام الآمن

## التحسينات المستقبلية

لتحسين تجربة AR، يمكنك:

1. **إضافة تتبع الوجه** باستخدام:
   - ARKit Face Tracking (iOS)
   - ML Kit Face Detection (Android)

2. **إضافة تتبع الجسم الكامل** باستخدام:
   - ARKit Body Tracking (iOS)
   - ML Kit Pose Detection (Android)

3. **تحسين الرسومات** باستخدام:
   - Post-processing effects
   - Particle system optimization
   - Custom shaders

## المشاكل الشائعة وحلولها

### الكاميرا لا تعمل
- تأكد من منح الأذونات للكاميرا
- تحقق من أن الجهاز يدعم الكاميرا
- راجع console logs للأخطاء

### AR لا يظهر بشكل صحيح
- تأكد من تثبيت جميع المتطلبات
- راجع أن ARCore/ARKit مفعلة
- تحقق من إصدار نظام التشغيل

### الأداء بطيء
- قلل عدد الجسيمات
- استخدم LOD (Level of Detail) للنماذج
- قلل دقة الكاميرا

## موارد إضافية

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [ARKit Documentation](https://developer.apple.com/augmented-reality/arkit/)
- [ARCore Documentation](https://developers.google.com/ar)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

## الدعم

إذا واجهت أي مشاكل:
1. راجع [Lovable Documentation](https://docs.lovable.dev/)
2. تحقق من [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
3. اسأل في [Discord Community](https://discord.gg/lovable)
