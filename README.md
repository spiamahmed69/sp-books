# SP Books — মাল্টি-ভেন্ডর অনলাইন বইয়ের দোকান

React 19 + Vite + Tailwind v4 + Firebase। বাংলাদেশের পাঠকদের জন্য বহু-বিক্রেতার
অনলাইন বইয়ের দোকান — উপন্যাস, কবিতা, গল্প, ইতিহাস, বিজ্ঞান, শিশুতোষ, ধর্ম,
আত্মউন্নয়ন। বাংলা ডিফল্ট ভাষা, ইংরেজি টগল, ডার্ক মোড।

## Demo Mode (কোনো Firebase ছাড়াই চালান)

```bash
npm install   # VM-এ npm registry সমস্যা হলে ../sp-marketplace থেকে node_modules কপি করুন
npm run dev   # http://localhost:5173
npm run build
```

Firebase env var না থাকলে (বা `VITE_DEMO_MODE=true`) অ্যাপ ডেমো মোডে চলে:
সব ডেটা `src/data/demo.js` + localStorage থেকে আসে, অর্ডার/স্টক/কুপন সবই
লোকালি কাজ করে। ডেমো মোড ব্যানারে স্পষ্টভাবে লেখা থাকে।

### ডেমো অ্যাকাউন্ট (লগইন পাতায় ক্লিক করলেই পূরণ হয়)

| ভূমিকা | ইমেইল | পাসওয়ার্ড |
|---|---|---|
| Super Admin | admin@sp.demo | admin123 |
| Moderator | moderator@sp.demo | mod123 |
| Seller | seller@sp.demo | seller123 |
| Customer | customer@sp.demo | customer123 |

ডেমো কুপন: **SP10** (১০% ছাড়, ৳১,০০০+ অর্ডারে)।

### এন্ড-টু-এন্ড চেকআউট পরীক্ষা

1. `customer@sp.demo / customer123` দিয়ে লগইন করুন।
2. দুই ভিন্ন সেলারের বই কার্টে নিন (যেমন হিমু + কালবেলা)।
3. Cart → Checkout → ঠিকানা (জেলা ঢাকা / ঢাকার বাইরে, উপজেলা) → পেমেন্ট COD
   → কুপন SP10 প্রয়োগ করুন → Place Order।
4. অর্ডার সফল হলে Order ID পাবেন; Track Order-এ টাইমলাইন দেখুন।
5. Seller হিসেবে লগইন করে Seller Dashboard → Orders থেকে স্ট্যাটাস বদলান;
   Admin হিসেবে Admin Dashboard → Orders/Payments/Commissions দেখুন।

## ভূমিকা ও নিরাপত্তা

- ভূমিকা: Super Admin, Moderator, Seller/Publisher, Customer।
- **ফ্রন্টএন্ডের role চেক শুধু UI রাউটিং।** আসল অনুমোদন Firebase
  কাস্টম ক্লেইমে (`functions/index.js` → `setAdminClaim`, শুধু বিদ্যমান
  অ্যাডমিন কল করতে পারেন) এবং `firestore.rules` / `storage.rules`-এ।
  `firestore.rules`-এ কোথাও `allow read, write: if true` নেই।
- Role assignment: বিশ্বস্ত সার্ভার-সাইড প্রক্রিয়া (Admin SDK custom claims)।
  প্রথম অ্যাডমিন Firebase Console থেকে তৈরি করতে হয়, তারপর তিনি অন্যদের
  role দেন। ডেমো মোডে role ডেমো অ্যাকাউন্ট থেকে আসে (ডেমো-অনলি)।

## মাল্টি-ভেন্ডর অর্ডার আর্কিটেকচার

চেকআউটে একটি parent `orders` ডকুমেন্ট + প্রতি সেলারে একটি করে
`sellerOrders` ডকুমেন্ট তৈরি হয়। প্রতি সেলারের সাবটোটাল, ১০% প্ল্যাটফর্ম
কমিশন, সেলার আয়, আলাদা পেমেন্ট রেকর্ড। অর্ডারে বইয়ের শিরোনাম/দাম/প্রচ্ছদ
**immutable snapshot** হিসেবে কপি করা হয়। ডেমো মোডে
`src/lib/firestore.js` → `createOrder()` একই নিয়মে চলে: স্টক চেক
(overselling প্রতিরোধ), idempotency key (ডুপ্লিকেট অর্ডার প্রতিরোধ),
স্টক কমানো। প্রোডাকশনে একই লজিক `functions/index.js` → `createOrder`
Firestore ট্রানজাকশনে চলে।

## ডেলিভারি ও পেমেন্ট

- ডেলিভারি চার্জ: ঢাকা ৳৬০, ঢাকার বাইরে ৳১২০, ৳১,৫০০+ অর্ডারে ফ্রি।
- পেমেন্ট: COD, bKash, Nagad, কার্ড (গেটওয়ে)। পেমেন্ট অ্যাবস্ট্রাকশন
  `src/services/payment.js` — provider ইন্টারফেস + ডেমো প্রোভাইডার।
  bKash/Nagad TrxID ম্যানুয়াল যাচাই (অ্যাডমিন)। **কার্ড নম্বর/CVV/
  পাসওয়ার্ড কোথাও সংরক্ষণ করা হয় না** — শুধু শেষ ৪ ডিজিট (cardLast4)।
  আসল গেটওয়ে যাচাই সার্ভার-সাইডে `functions/verifyPayment`-এ হয়;
  ফ্রন্টএন্ডের "পেমেন্ট সফল" বার্তা কখনো বিশ্বাস করা হয় না।
- কুরিয়ার ইন্টিগ্রেশন আর্কিটেকচার: অর্ডার স্ট্যাটাস `processing →
  confirmed → shipped → delivered`; `shipped` হলে কুরিয়ার API-তে
  (Pathao/Steadfast/RedX) কনসাইনমেন্ট তৈরি + ট্র্যাকিং আইডি অর্ডারে
  সংরক্ষণের জায়গা `sellerOrders`/`orders` ডকুমেন্টে রাখা আছে।
  প্রোডাকশনে কুরিয়ার কল Cloud Function থেকে (সার্ভার-সাইড কী) করতে হবে।

## ডেটা মডেল (Firestore collections)

| Collection | মূল ফিল্ড |
|---|---|
| users | name, email, role, phone, addresses |
| sellers | ownerId, storeName, status (pending/approved/rejected), verified, logo, description |
| stores | ownerId, name, logo, banner, description |
| books | title, titleBn, slug, authorId, publisherId, isbn, edition, language, pages, binding, category, description, coverImage, images, price, oldPrice, stock, sold, sellerId, publicationDate, featured, approvalStatus, rating, totalReviews, searchKeywords |
| authors | name, nameBn, bio, featured |
| publishers | name, nameBn, founded, featured |
| categories | slug, name, nameBn |
| carts / wishlists | userId, items |
| orders | customerId, items (snapshot), address, paymentMethod, paymentStatus, subtotal, discount, shipping, total, couponCode, status, sellerIds, idempotencyKey |
| sellerOrders | parentOrderId, sellerId, items, subtotal, commission, sellerEarnings, status |
| payments | orderId, method, amount, txnId, cardLast4, status |
| reviews | bookId, userId, userName, rating, comment, status |
| coupons | code, discountPercent, minOrder, active |
| banners | title, titleEn, subtitle, link, active |
| notifications | userId, type, title, body, orderId, read |
| commissions | sellerId, orderId, amount, rate |
| addresses | userId, name, phone, address, district, upazila |
| settings | commissionRate, shippingDhaka, shippingOutsideDhaka, freeShippingAbove |
| auditLogs | actor, role, action, target, createdAt |

সম্পর্ক: `books.sellerId → sellers`, `books.authorId → authors`,
`books.publisherId → publishers`, `orders.customerId → users`,
`sellerOrders.parentOrderId → orders`, `payments.orderId → orders`,
`reviews.bookId → books`, `commissions.orderId → orders`.

## ISBN যাচাই

`src/lib/isbn.js` — ISBN-10/13 চেক-ডিজিট যাচাই। সেলার Add-Book ফর্মে
ভুল ISBN ব্লক হয়; `saveBook()`-এ ডুপ্লিকেট ISBN গার্ড আছে।

## ছবি আপলোড (ImgBB)

`ImageUpload` কম্পোনেন্ট: টাইপ + ৫ MB যাচাই, প্রোগ্রেস, এরর + রিট্রাই।
ডেমো মোডে আপলোড সিমুলেট করে data URL সংরক্ষণ করে। Firebase মোডে
`uploadImage` Cloud Function ImgBB-তে আপলোড করে — API কী শুধু
`functions/.env`-এ (সার্ভার-সাইড), ফ্রন্টএন্ডে কখনো নয়।

## SEO

SEO-ফ্রেন্ডলি URL (`/books/:slug`, `/authors/:slug`), প্রতি পাতায়
অনন্য title/meta (SEO কম্পোনেন্ট), Open Graph, বই পাতায় Book +
Breadcrumb JSON-LD, `public/sitemap.xml`, `public/robots.txt`,
lazy loading, React.lazy দিয়ে seller/admin ড্যাশবোর্ড কোড-স্প্লিটিং।

## Firebase সেটআপ (প্রোডাকশন)

1. Firebase Console-এ প্রজেক্ট তৈরি করুন; Auth (Email/Google), Firestore,
   Storage চালু করুন।
2. `.env.example` কপি করে `.env` বানান, নিজের কীগুলো বসান। **কী কখনো
   কমিট করবেন না।**
3. `firebase deploy --only firestore:rules,storage` তারপর
   `firebase deploy --only functions` (ImgBB-র জন্য `functions/.env`-এ
   `IMGBB_API_KEY` দিন; Blaze প্ল্যান লাগতে পারে)।
4. প্রথম অ্যাডমিন: Console থেকে ইউজার বানিয়ে Admin SDK দিয়ে
   `setAdminClaim` কল করুন (বা `firebase functions:shell`)।
5. হোস্টিং: `npm run build` → `firebase deploy --only hosting`
   (বা Vercel-এ `dist/` ডিপ্লয় করুন)।

## ডিজাইন

UI/UX Pro Max স্কিলের রেফারেন্স + ব্যবহারকারীর টোকেন:
primary `#6B422E`, secondary `#C49A6C`, background `#F7F3EC`,
surface `#FFFFFF`, text `#282522`। ফন্ট: Hind Siliguri (বাংলা),
Inter (ইংরেজি), Playfair Display (এডিটোরিয়াল হেডিং)।
বইয়ের প্রচ্ছদ CSS/SVG দিয়ে তৈরি (`BookCover` কম্পোনেন্ট) — কোনো
ব্র্যান্ডের লোগো বা সম্পদ কপি করা হয়নি।
