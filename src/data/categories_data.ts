// Spot Music — Spotify Desktop Official "Tout parcourir" Categories Data
// High-Resolution Curated Cover Imagery & 100% Reliable Loading (Zero 429)
import { Track } from '../types';

export interface BrowseCategory {
  id: string;
  title: string;
  hexColor: string;
  bgClass: string;
  query: string;
  coverUrl: string;
  description: string;
}

export const SPOTIFY_BROWSE_CATEGORIES: BrowseCategory[] = [
  // 1. Musique
  {
    id: 'cat-music',
    title: 'Musique',
    hexColor: '#DC148C',
    bgClass: 'bg-[#DC148C]',
    query: 'Top Hits France Pop',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    description: 'Les plus grands hits du moment, des sommets des classements aux pépites émergentes.',
  },
  // 2. Podcasts
  {
    id: 'cat-podcasts',
    title: 'Podcasts',
    hexColor: '#006450',
    bgClass: 'bg-[#006450]',
    query: 'Science Vs Affaires Sensibles HugoDecrypte',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80',
    description: 'Émissions, interviews exclusives, enquêtes et récits captivants.',
  },
  // 3. Livres audio
  {
    id: 'cat-audiobooks',
    title: 'Livres audio',
    hexColor: '#1E3264',
    bgClass: 'bg-[#1E3264]',
    query: 'Le Petit Prince 1984 George Orwell Albert Camus',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    description: 'Les plus grands chefs-d’œuvre de la littérature racontés par des voix d’exception.',
  },
  // 4. Événements live & Concerts
  {
    id: 'cat-live',
    title: 'Événements live',
    hexColor: '#8400E7',
    bgClass: 'bg-[#8400E7]',
    query: 'Live acoustic concert festival Paris',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    description: 'Vivez l’énergie brute des concerts et des festivals live en direct.',
  },
  // 5. Conçu spécialement pour vous
  {
    id: 'cat-foryou',
    title: 'Conçu pour vous',
    hexColor: '#1E3264',
    bgClass: 'bg-[#1E3264]',
    query: 'Strawberry Guy Damso SDM Vacra Tiakola',
    coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    description: 'Vos recommandations personnalisées, mixes quotidiens et sélections sur-mesure.',
  },
  // 6. Nouveautés & Sorties
  {
    id: 'cat-new',
    title: 'Dernières sorties',
    hexColor: '#8C67AC',
    bgClass: 'bg-[#8C67AC]',
    query: 'New Music Friday France 2026',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    description: 'Toutes les nouveautés du vendredi et les dernières sorties d’albums officielles.',
  },
  // 7. Hip-Hop & Rap Français
  {
    id: 'cat-hiphop',
    title: 'Hip-Hop & Rap',
    hexColor: '#BA5D07',
    bgClass: 'bg-[#BA5D07]',
    query: 'SDM Guy2Bezbar Damso Tiakola Gazo Booba',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    description: 'Le meilleur du rap francophone et US : bangers, flows tranchants et rimes percutantes.',
  },
  // 8. Pop & Hits Mondiaux
  {
    id: 'cat-pop',
    title: 'Pop Mondiale',
    hexColor: '#148A08',
    bgClass: 'bg-[#148A08]',
    query: 'Dua Lipa Billie Eilish The Weeknd Pop',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80',
    description: 'Les refrains incontournables qui font vibrer la planète entière.',
  },
  // 9. Ambiance Japon & Mont Fuji
  {
    id: 'cat-japan',
    title: 'Japon & Mont Fuji',
    hexColor: '#0E7490',
    bgClass: 'bg-[#0E7490]',
    query: 'YOASOBI Joe Hisaishi Japanese Lofi Kenshi Yonezu',
    coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    description: 'Ambiance zen, mont Fuji, city pop et OST d’animation japonaise.',
  },
  // 10. Variété Française
  {
    id: 'cat-variete',
    title: 'Variété Française',
    hexColor: '#509BF5',
    bgClass: 'bg-[#509BF5]',
    query: 'Jean-Jacques Goldman Mylène Farmer Renaud Cabrel',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    description: 'Les classiques indémodables de la chanson française et du patrimoine.',
  },
  // 11. Électro & Chill
  {
    id: 'cat-chill',
    title: 'Détente & Électro',
    hexColor: '#E1118C',
    bgClass: 'bg-[#E1118C]',
    query: 'Kavinsky Daft Punk French 79 Chill Electronic',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    description: 'Synthwave, deep house, ambient lofi et ondes apaisantes pour s’évader.',
  },
  // 12. Classements Top 50
  {
    id: 'cat-rankings',
    title: 'Classements Top 50',
    hexColor: '#537AA1',
    bgClass: 'bg-[#537AA1]',
    query: 'Top 50 Global Songs France',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    description: 'Le baromètre musical mondial en direct : les 50 titres les plus écoutés.',
  },
  // 13. Rock & Métal
  {
    id: 'cat-rock',
    title: 'Rock & Métal',
    hexColor: '#B02897',
    bgClass: 'bg-[#B02897]',
    query: 'AC DC Nirvana Metallica Linkin Park Rock',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&q=80',
    description: 'Riffs de guitare légendaires, distorsion et énergie rock intemporelle.',
  },
  // 14. R&B & Soul
  {
    id: 'cat-rnb',
    title: 'R&B & Soul',
    hexColor: '#8D67AB',
    bgClass: 'bg-[#8D67AB]',
    query: 'SZA The Weeknd Frank Ocean Daniel Caesar',
    coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
    description: 'Grooves chaleureux, voix veloutées et mélodies envoûtantes.',
  },
  // 15. Gaming & Musique de Films
  {
    id: 'cat-gaming',
    title: 'Gaming & OST',
    hexColor: '#E91429',
    bgClass: 'bg-[#E91429]',
    query: 'Hans Zimmer Zelda Minecraft OST Interstellar',
    coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    description: 'Les bandes originales les plus épiques du jeu vidéo et du cinéma.',
  },
  // 16. Sommeil & Focus
  {
    id: 'cat-sleep',
    title: 'Sommeil & Focus',
    hexColor: '#1E3264',
    bgClass: 'bg-[#1E3264]',
    query: 'Lofi sleep white noise rain sounds piano',
    coverUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
    description: 'Bruits de pluie, fréquences douces et piano apaisant pour la concentration.',
  },
];
