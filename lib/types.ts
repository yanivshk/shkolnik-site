export type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  series: number[];
  marketState: "open" | "closed";
};

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  date: string | null;
  image?: string | null;
  highlight?: boolean;
};

export type Game = {
  id: string;
  league: string;
  date: string;
  status: string;
  state: "pre" | "in" | "post";
  home: { name: string; short: string; score: string; logo?: string };
  away: { name: string; short: string; score: string; logo?: string };
  highlight: boolean;
};

export type DailyPhoto = {
  src: string;
  title: string;
  description: string;
  credit: string;
  link: string;
};
