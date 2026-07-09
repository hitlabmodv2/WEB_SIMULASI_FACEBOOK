// ===== MOCK DATA =====

export const COLORS = ['#1877f2','#e74c3c','#27ae60','#8e44ad','#f39c12','#16a085','#d35400','#2980b9'];

export function getColor(id) {
  return COLORS[id % COLORS.length];
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const currentUser = {
  id: 1,
  name: 'Budi Santoso',
  username: 'budi.santoso',
  bio: 'Suka coding, fotografi, dan kopi ☕ | Jakarta, Indonesia',
  location: 'Jakarta, Indonesia',
  work: 'Software Developer at PT. Teknologi Nusantara',
  school: 'Universitas Indonesia',
  relationship: 'Lajang',
  joined: 'Bergabung Januari 2018',
  followers: 1243,
  following: 867,
  coverBg: 'linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)',
  coverEmoji: '🌆',
};

export const users = [
  { id: 1, name: 'Budi Santoso',    bio: 'Software Developer',    location: 'Jakarta',   mutual: 0  },
  { id: 2, name: 'Siti Rahma',      bio: 'UI/UX Designer',        location: 'Bandung',   mutual: 12 },
  { id: 3, name: 'Ahmad Fauzi',     bio: 'Backend Engineer',      location: 'Surabaya',  mutual: 8  },
  { id: 4, name: 'Dewi Lestari',    bio: 'Product Manager',       location: 'Bali',      mutual: 5  },
  { id: 5, name: 'Rizky Pratama',   bio: 'Data Scientist',        location: 'Yogyakarta',mutual: 15 },
  { id: 6, name: 'Andi Wijaya',     bio: 'Mobile Developer',      location: 'Medan',     mutual: 3  },
  { id: 7, name: 'Putri Handayani', bio: 'Content Creator',       location: 'Jakarta',   mutual: 20 },
  { id: 8, name: 'Fajar Nugroho',   bio: 'Graphic Designer',      location: 'Semarang',  mutual: 7  },
  { id: 9, name: 'Mega Wati',       bio: 'Entrepreneur',          location: 'Makassar',  mutual: 2  },
  { id: 10,name: 'Reza Kurniawan',  bio: 'DevOps Engineer',       location: 'Bandung',   mutual: 11 },
  { id: 11,name: 'Lina Susanti',    bio: 'Digital Marketer',      location: 'Jakarta',   mutual: 9  },
  { id: 12,name: 'Hendra Yusuf',    bio: 'Startup Founder',       location: 'Surabaya',  mutual: 6  },
];

export const friendIds = new Set([2, 3, 5, 7, 10]);
export const requestIds = new Set([4, 6]);

export const stories = [
  { id: 1, userId: 2, emoji: '🏖️', bg: '#ffecd2',   text: 'Liburan di Bali! 🌴' },
  { id: 2, userId: 3, emoji: '💻', bg: '#667eea',   text: 'Ngoding semalaman 😅' },
  { id: 3, userId: 5, emoji: '📊', bg: '#f093fb',   text: 'Present data science! 🚀' },
  { id: 4, userId: 7, emoji: '🎥', bg: '#4facfe',   text: 'Shooting konten baru 🎬' },
  { id: 5, userId: 10,emoji: '☁️', bg: '#43e97b',   text: 'Deploy sukses! 🎉' },
  { id: 6, userId: 11,emoji: '📱', bg: '#fa709a',   text: 'Campaign digital 📣' },
];

let postIdCounter = 100;
export function newPostId() { return ++postIdCounter; }

export const posts = [
  {
    id: 1, userId: 2,
    text: 'Halo semua! Baru pulang dari Bali. Indah banget pemandangannya, pasti balik lagi! 🌴🏄‍♀️',
    image: null, imageEmoji: null,
    likes: 124, likedBy: new Set([3,5,7,10,11]),
    comments: [
      { id: 1, userId: 3, text: 'Wah asik banget! Kapan balik lagi ke sana? 😄', likes: 8, time: '1 jam lalu' },
      { id: 2, userId: 5, text: 'Iri banget, pengen juga ke Bali 🤩', likes: 5, time: '45 menit lalu' },
    ],
    time: '2 jam lalu', privacy: '🌐',
  },
  {
    id: 2, userId: 3,
    text: 'Baru selesai bikin API REST dengan Node.js + PostgreSQL. Performanya ngebut banget! Kalau ada yang mau belajar backend, feel free DM ya 💪',
    image: null, imageEmoji: '💻',
    likes: 87, likedBy: new Set([2,5,7]),
    comments: [
      { id: 3, userId: 10, text: 'Mantap! Pakai framework apa? Express atau Fastify? 🤔', likes: 3, time: '30 menit lalu' },
    ],
    time: '5 jam lalu', privacy: '🌐',
  },
  {
    id: 3, userId: 5,
    text: '📊 Fun fact: Indonesia punya lebih dari 270 juta pengguna internet! Data ini menunjukkan betapa besarnya potensi digital marketing di sini. Thread tentang tren data science 2025 👇',
    image: null, imageEmoji: null,
    likes: 203, likedBy: new Set([2,3,7,10,11,12]),
    comments: [
      { id: 4, userId: 7, text: 'Sangat informatif! Thx untuk sharingnya 🙏', likes: 12, time: '2 jam lalu' },
      { id: 5, userId: 11, text: 'Bagus banget threadnya! Boleh share ke teman?', likes: 7, time: '1 jam lalu' },
    ],
    time: '8 jam lalu', privacy: '🌐',
  },
  {
    id: 4, userId: 7,
    text: 'Video baru udah upload! "5 Tips Produktivitas untuk Anak Muda" — semoga bermanfaat ya 🎬✨',
    image: null, imageEmoji: '🎬',
    likes: 456, likedBy: new Set([2,3,5,10,11,12,8,9]),
    comments: [
      { id: 6, userId: 8, text: 'Selalu ditunggu kontennya! 🔥', likes: 24, time: '3 jam lalu' },
      { id: 7, userId: 9, text: 'Makasih tipsnya! Sangat membantu 😊', likes: 18, time: '2 jam lalu' },
      { id: 8, userId: 2, text: 'Subs lagi tumbuh pesat nih! 🚀', likes: 15, time: '1 jam lalu' },
    ],
    time: '1 hari lalu', privacy: '🌐',
  },
  {
    id: 5, userId: 10,
    text: 'Deploy ke production tanpa error = 1 dalam sejuta. Hari ini kita berhasil! 🎉🚀 Terima kasih tim DevOps yang luar biasa!',
    image: null, imageEmoji: null,
    likes: 178, likedBy: new Set([2,3,5]),
    comments: [
      { id: 9, userId: 3, text: 'Congrats! Zero downtime deploy nih 👏', likes: 10, time: '5 jam lalu' },
    ],
    time: '1 hari lalu', privacy: '👥',
  },
  {
    id: 6, userId: 11,
    text: 'Weekend vibes! ☕ Kadang yang kita butuhkan cuma secangkir kopi dan koneksi internet yang stabil 😄',
    image: null, imageEmoji: '☕',
    likes: 312, likedBy: new Set([2,3,5,7,10,8,9]),
    comments: [],
    time: '2 hari lalu', privacy: '🌐',
  },
  {
    id: 7, userId: 8,
    text: 'Portofolio baru sudah live! Cek di link bio ya — feedback sangat disambut 🙏 #GraphicDesign #Portfolio',
    image: null, imageEmoji: '🎨',
    likes: 94, likedBy: new Set([2,7,11]),
    comments: [
      { id: 10, userId: 7, text: 'Waaah keren banget desainnya! 😍', likes: 9, time: '1 hari lalu' },
    ],
    time: '2 hari lalu', privacy: '🌐',
  },
  {
    id: 8, userId: 12,
    text: 'Startup saya baru dapat funding Series A! 🎊 Tidak percaya ini nyata. Journey panjang, banyak penolakan, tapi akhirnya... Terima kasih untuk semua yang sudah support dari awal! ❤️',
    image: null, imageEmoji: '🚀',
    likes: 1203, likedBy: new Set([2,3,5,7,10,11,8,9]),
    comments: [
      { id: 11, userId: 2, text: 'Selamat! Deserved banget! 🎉🎉', likes: 45, time: '2 hari lalu' },
      { id: 12, userId: 5, text: 'Amazing journey! Proud of you! 💪', likes: 38, time: '2 hari lalu' },
      { id: 13, userId: 7, text: 'Inspirasinya nyata banget! 🙌', likes: 32, time: '1 hari lalu' },
    ],
    time: '3 hari lalu', privacy: '🌐',
  },
];

export const notifications = [
  { id: 1,  userId: 2,  type: 'like',     text: 'menyukai foto profilmu.',       time: '2 menit lalu',  unread: true  },
  { id: 2,  userId: 3,  type: 'comment',  text: 'berkomentar di postinganmu: "Keren banget kodenya!"', time: '15 menit lalu', unread: true  },
  { id: 3,  userId: 4,  type: 'friend',   text: 'mengirim permintaan pertemanan kepadamu.', time: '1 jam lalu',    unread: true  },
  { id: 4,  userId: 5,  type: 'like',     text: 'dan 12 orang lain menyukai postinganmu.', time: '2 jam lalu',    unread: true  },
  { id: 5,  userId: 7,  type: 'share',    text: 'membagikan postinganmu.',        time: '3 jam lalu',    unread: true  },
  { id: 6,  userId: 6,  type: 'friend',   text: 'mengirim permintaan pertemanan kepadamu.', time: '5 jam lalu',    unread: false },
  { id: 7,  userId: 8,  type: 'comment',  text: 'berkomentar: "Desain kamu selalu keren!"', time: '8 jam lalu',    unread: false },
  { id: 8,  userId: 10, type: 'like',     text: 'menyukai komentarmu.',           time: '1 hari lalu',   unread: false },
  { id: 9,  userId: 11, type: 'tag',      text: 'menandaimu dalam sebuah foto.',  time: '1 hari lalu',   unread: false },
  { id: 10, userId: 9,  type: 'birthday', text: 'berulang tahun hari ini. Kirimkan ucapan! 🎂', time: '2 hari lalu',   unread: false },
];

export const conversations = [
  {
    id: 1, userId: 2,
    messages: [
      { id: 1, from: 2, text: 'Hei! Gimana kabarnya? 😊', time: '10:30' },
      { id: 2, from: 1, text: 'Baik banget! Kamu gimana?', time: '10:32' },
      { id: 3, from: 2, text: 'Alhamdulillah baik juga! Lagi ngapain nih?', time: '10:33' },
      { id: 4, from: 1, text: 'Lagi ngoding, bikin project baru hehe', time: '10:35' },
      { id: 5, from: 2, text: 'Wah keren! Semangat ya! 💪', time: '10:36' },
    ],
    unread: 0,
  },
  {
    id: 2, userId: 3,
    messages: [
      { id: 1, from: 3, text: 'Bro, udah coba framework yang kemarin aku rekomenin?', time: '09:15' },
      { id: 2, from: 1, text: 'Belum sempet, besok deh 😅', time: '09:20' },
      { id: 3, from: 3, text: 'Oke, nanti aku bantuin kalau ada yang bingung', time: '09:21' },
    ],
    unread: 0,
  },
  {
    id: 3, userId: 5,
    messages: [
      { id: 1, from: 5, text: 'Kak Budi, boleh minta saran soal portfolio ga?', time: 'Kemarin' },
      { id: 2, from: 1, text: 'Boleh banget! Share aja dulu portfolionya', time: 'Kemarin' },
      { id: 3, from: 5, text: 'Makasih banyak! Nanti aku share ya 🙏', time: 'Kemarin' },
    ],
    unread: 2,
  },
  {
    id: 4, userId: 7,
    messages: [
      { id: 1, from: 7, text: 'Makasih udah support kontenku ya! ❤️', time: 'Senin' },
      { id: 2, from: 1, text: 'Kontennya emang bagus banget! Keep it up!', time: 'Senin' },
    ],
    unread: 0,
  },
  {
    id: 5, userId: 10,
    messages: [
      { id: 1, from: 10, text: 'Deploy udah beres! Terima kasih bantuannya 🎉', time: 'Minggu' },
      { id: 2, from: 1, text: 'Siipp! Sama-sama. Kerjasama yang baik!', time: 'Minggu' },
    ],
    unread: 1,
  },
];

export const sidebarLinks = [
  { id: 'feed',          icon: '🏠', label: 'Beranda',            color: 'blue'   },
  { id: 'profile',       icon: '👤', label: 'Profil',             color: 'blue'   },
  { id: 'friends',       icon: '👥', label: 'Teman',              color: 'blue'   },
  { id: 'watch',         icon: '▶️', label: 'Watch',              color: 'red'    },
  { id: 'marketplace',   icon: '🛍️', label: 'Marketplace',        color: 'teal'   },
  { id: 'groups',        icon: '📌', label: 'Grup',               color: 'purple' },
  { id: 'gaming',        icon: '🎮', label: 'Gaming',             color: 'purple' },
  { id: 'saved',         icon: '🔖', label: 'Tersimpan',          color: 'purple' },
  { id: 'memories',      icon: '🕰️', label: 'Kenangan',           color: 'blue'   },
  { id: 'events',        icon: '📅', label: 'Acara',              color: 'red'    },
];

export const sponsored = [
  { id: 1, name: 'Tokopedia',      domain: 'tokopedia.com',   desc: 'Belanja mudah, hemat, dan aman.',            emoji: '🛒', bg: '#35b551' },
  { id: 2, name: 'Gojek',          domain: 'gojek.com',       desc: 'Solusi transportasi dan delivery terbaik.',  emoji: '🛵', bg: '#00aed6' },
  { id: 3, name: 'Traveloka',      domain: 'traveloka.com',   desc: 'Pesan tiket & hotel terbaik di sini!',       emoji: '✈️', bg: '#007aff' },
];
