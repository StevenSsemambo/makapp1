# MakChat — Appwrite Setup Guide

Follow these steps to connect MakChat to Appwrite cloud (free tier works fine).

---

## 1. Create an Appwrite Account & Project

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io) and sign up.
2. Click **Create Project** → name it `MakChat`.
3. Copy the **Project ID** shown on the project overview page.

---

## 2. Update `js/appwrite.js`

Open `js/appwrite.js` and fill in:

```js
const APPWRITE_PROJECT_ID = 'your_project_id_here';
```

If you self-host Appwrite, also change:
```js
const APPWRITE_ENDPOINT = 'https://your-appwrite-server.com/v1';
```

---

## 3. Create the Database

1. In the Appwrite Console sidebar → **Databases** → **Create Database**.
2. Name it `MakChat DB`.
3. Copy the **Database ID** and update `js/appwrite.js`:

```js
const DB_ID = 'your_database_id_here';
```

---

## 4. Create Collections

For each collection below, go to **Databases → MakChat DB → Create Collection**.
Set the collection ID exactly as shown (or update `COLLECTIONS` map in `js/appwrite.js`).

### Collection: `users`
| Attribute      | Type    | Required | Notes                          |
|----------------|---------|----------|--------------------------------|
| name           | String  | Yes      | max 100                        |
| username       | String  | Yes      | max 50                         |
| email          | String  | Yes      | max 200                        |
| college        | String  | No       | max 200                        |
| course         | String  | No       | max 200                        |
| year           | String  | No       | max 20                         |
| contact        | String  | No       | max 50                         |
| color          | String  | No       | max 20, default `#2D6A27`      |
| bio            | String  | No       | max 500                        |
| photo          | String  | No       | max 5000000 (base64 data URL)  |
| verified       | Boolean | No       | default false                  |
| is_mentor      | Boolean | No       | default false                  |
| connections    | String  | No       | max 100000 (JSON array)        |
| groups         | String  | No       | max 10000 (JSON array)         |
| portfolio      | String  | No       | max 100000 (JSON array)        |
| skills         | String  | No       | max 50000 (JSON array)         |
| interests      | String  | No       | max 500                        |
| points         | Integer | No       | default 100                    |
| created_at     | Integer | No       | Unix timestamp (ms)            |

### Collection: `posts`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| body        | String  | Yes      max 5000 |
| tag         | String  | No       |
| anon        | Boolean | No       |
| anon_label  | String  | No       |
| likes       | String  | No       (JSON array) |
| comments    | String  | No       (JSON array, max 200000) |
| image       | String  | No       (max 5000000) |
| created_at  | Integer | No       |

### Collection: `chats`
| Attribute    | Type    | Required |
|--------------|---------|----------|
| participants | String  | No       (JSON array) |
| created_at   | Integer | No       |

### Collection: `messages`
| Attribute  | Type    | Required |
|------------|---------|----------|
| chat_id    | String  | Yes      |
| from_user  | String  | Yes      |
| body       | String  | No       (max 5000000 for file embeds) |
| is_file    | Boolean | No       |
| file_name  | String  | No       |
| read_by    | String  | No       (JSON array) |
| reactions  | String  | No       (JSON object) |
| created_at | Integer | No       |

### Collection: `groups`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| name        | String  | Yes      |
| emoji       | String  | No       |
| description | String  | No       |
| desc        | String  | No       |
| type        | String  | No       |
| college     | String  | No       |
| members     | String  | No       (JSON array) |
| admins      | String  | No       (JSON array) |
| max         | String  | No       |
| days        | String  | No       |
| progress    | Integer | No       |
| streak      | Integer | No       |
| points      | Integer | No       |
| created_by  | String  | No       |
| created_at  | Integer | No       |

### Collection: `group_messages`
| Attribute  | Type    | Required |
|------------|---------|----------|
| group_id   | String  | Yes      |
| from_user  | String  | Yes      |
| body       | String  | No       (max 5000000) |
| is_file    | Boolean | No       |
| file_name  | String  | No       |
| reactions  | String  | No       |
| created_at | Integer | No       |

### Collection: `channels`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| name        | String  | Yes      |
| description | String  | No       |
| type        | String  | No       |
| college     | String  | No       |
| members     | String  | No       (JSON array) |
| created_by  | String  | No       |
| created_at  | Integer | No       |

### Collection: `channel_messages`
| Attribute  | Type    | Required |
|------------|---------|----------|
| channel_id | String  | Yes      |
| from_user  | String  | Yes      |
| body       | String  | No       (max 5000000) |
| is_file    | Boolean | No       |
| file_name  | String  | No       |
| created_at | Integer | No       |

### Collection: `listings`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| price       | Integer | No       |
| condition   | String  | No       |
| category    | String  | No       |
| description | String  | No       |
| emoji       | String  | No       |
| image       | String  | No       (max 5000000) |
| sold        | Boolean | No       |
| contact     | String  | No       |
| created_at  | Integer | No       |

### Collection: `hostels`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| type        | String  | No       |
| price       | Integer | No       |
| location    | String  | No       |
| description | String  | No       |
| contact     | String  | No       |
| rating      | Integer | No       |
| created_at  | Integer | No       |

### Collection: `gigs`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| category    | String  | No       |
| rate        | String  | No       |
| description | String  | No       |
| contact     | String  | No       |
| rating      | Float   | No       |
| orders      | Integer | No       |
| reviews     | String  | No       (JSON array) |
| created_at  | Integer | No       |

### Collection: `events`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| category    | String  | No       |
| date        | String  | No       |
| time        | String  | No       |
| venue       | String  | No       |
| description | String  | No       |
| organizer   | String  | No       |
| rsvps       | String  | No       (JSON array) |
| created_at  | Integer | No       |

### Collection: `announcements`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| body        | String  | No       |
| category    | String  | No       |
| college     | String  | No       |
| created_at  | Integer | No       |

### Collection: `lost_found`
| Attribute   | Type    | Required |
|-------------|---------|----------|
| user_id     | String  | Yes      |
| title       | String  | Yes      |
| type        | String  | No       (lost/found) |
| location    | String  | No       |
| date        | String  | No       |
| description | String  | No       |
| contact     | String  | No       |
| claimed     | Boolean | No       |
| created_at  | Integer | No       |

---

## 5. Set Collection Permissions

For each collection, go to **Settings → Permissions** and add:

| Role  | Create | Read | Update | Delete |
|-------|--------|------|--------|--------|
| Any   | ✓      | ✓    | ✓      | ✓      |

> **Note:** For production, tighten permissions. Users should only update/delete their own documents. Use Appwrite's document-level permissions for that.

---

## 6. Enable Realtime

Realtime is enabled by default on Appwrite Cloud. No extra steps needed.

To verify: go to **Databases → [collection] → Settings** — Realtime should show as active.

---

## 7. Add Web Platform

1. In your project → **Settings → Platforms → Add Platform → Web**.
2. Set **Name**: `MakChat`
3. Set **Hostname**: `localhost` (for dev) or your Netlify domain (e.g. `makchat.netlify.app`)
4. Click **Add**.

Without this step, Appwrite will block API requests from your domain.

---

## 8. Deploy to Netlify

1. Push your project to GitHub.
2. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**.
3. Select your repo. Set:
   - **Build command**: *(leave empty)*
   - **Publish directory**: `.` (root)
4. Click **Deploy**.
5. Go back to Appwrite → **Platforms** → add your Netlify domain as a web platform hostname.

---

## 9. Test

- Open the app at your Netlify URL.
- Register a new account — it should create an Appwrite Auth user AND a `users` document.
- Post something — it should appear in the `posts` collection.
- Open two browser tabs and chat — messages should sync via Realtime.

---

## Local Development (no Appwrite)

Leave `APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'` unchanged and the app runs fully offline using `localStorage` seed data. All features work — Appwrite sync is simply skipped.

Open `index.html` in a browser or run:
```bash
npx serve .
# or
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

---

## File Structure

```
makchat/
├── index.html          ← App shell (HTML + CSS only, no JS)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline support)
├── netlify.toml        ← Netlify deployment config
├── appwrite_setup.md   ← This file
├── icons/              ← App icons
└── js/
    ├── appwrite.js     ← Appwrite backend layer (replaces Supabase)
    ├── db.js           ← localStorage cache + seed data
    ├── state.js        ← Global state variables + helpers
    ├── auth.js         ← Login, register, logout
    ├── ui.js           ← Navigation, modals, toast, search
    ├── home.js         ← Home screen
    ├── feed.js         ← Posts & feed
    ├── chat.js         ← Direct messages
    ├── groups.js       ← Groups & group chat
    ├── channels.js     ← Channels
    ├── features.js     ← Market, Hostel, Gigs, Events, Opps, Announcements, L&F, People
    ├── profile.js      ← Profile, skills, portfolio
    └── boot.js         ← App bootstrap (DOMContentLoaded)
```
