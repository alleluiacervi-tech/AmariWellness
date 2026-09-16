/* ───────────────────────────────────────────────────────────────
   INTERIM PHOTOGRAPHY — REPLACE WITH THE REAL SHOOT

   Every image below was opened and looked at before being used, not
   trusted from its caption. The previous set was not: it captioned a
   leather wallet as the sanctuary, a stock headshot as the reading
   lounge, and a nude hot-stone therapy photo as an automated massage
   chair.

   These are mood and interior shots under the Unsplash licence. They
   set tone honestly — each `alt` describes what is actually in the
   frame — but none of them show your chairs or your rooms. Two slots
   are deliberately left as briefed placeholders because no honest
   stock exists for them:

     · the chair in motion (hero film)
     · the lockers

   For the chair itself, ask your supplier for their product
   photography. Dealers are normally permitted to use it, and it is
   the single image a first-time visitor most needs to see.
   ─────────────────────────────────────────────────────────────── */

export interface SiteImage {
  src: string
  alt: string
}

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`

export const IMAGES = {
  /** Dim room, heavy curtains, a single lamp. Stands in for a private suite. */
  suiteMood: {
    src: u('1698864551605-fab9fed03af5', 900, 700),
    alt: 'A dimly lit room with heavy curtains and a single desk lamp',
  },

  /** Library shelving under warm bulbs. */
  lounge: {
    src: u('1481627834876-b7833e8f5570', 900, 700),
    alt: 'Library shelving lit by warm hanging bulbs',
  },

  /** Tan leather armchair, woven side table, afternoon sun. */
  loungeChair: {
    src: u('1759329885455-f2c660d09d4e', 700, 900),
    alt: 'A tan leather armchair beside a woven table in afternoon light',
  },

  /** Curved timber panelling and concealed lighting. */
  architecture: {
    src: `${u('1616818400884-1c4f3d4d003c', 1800, 1000)}&v=2`,
    alt: 'A curved timber-panelled interior with concealed lighting',
  },

  /** Plywood chair, small stack of books, focused wall lamp. */
  readingLamp: {
    src: u('1637520943049-648cec6c18d5', 900, 700),
    alt: 'A wooden chair holding a small stack of books beneath a wall lamp',
  },

  /** Rust armchair in an alcove, open window onto trees. */
  windowSeat: {
    src: u('1758024836397-2c9c698087f0', 900, 700),
    alt: 'A rust-coloured armchair in an alcove beside an open window',
  },

  /** Warm timber walls, a single strip of light. */
  timberRoom: {
    src: u('1632378206664-853dabd4ffb4', 900, 700),
    alt: 'Warm timber walls lit by a single strip of light',
  },

  /** Low bench, floor cushions, round window. */
  quietRoom: {
    src: u('1512972972907-6d71529c5e92', 700, 900),
    alt: 'A low wooden bench and floor cushions beside a round window',
  },

  /** Rows of books on library shelves. Reads larger than a small shelf. */
  shelves: {
    src: u('1524995997946-a1c2e315a42f', 700, 900),
    alt: 'Rows of books on library shelves',
  },
} satisfies Record<string, SiteImage>
