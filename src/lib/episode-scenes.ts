/**
 * Episode-specific visual scenes, motion video layers, dynamic subtitles,
 * and synthesized Web Audio soundscapes for ShortReel.
 * Provides authentic, differentiated video experiences for every single episode.
 */

export type EpisodeCaption = {
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
};

export type EpisodeScene = {
  id: string;
  seriesSlug: string;
  episodeNumber: number;
  title: string;
  scenePoster: string;
  thumbnail: string;
  videoUrl?: string | undefined;
  atmosphere: "monsoon" | "thriller" | "cctv" | "neon" | "campus" | "folk" | "corporate";
  gradeFilter: string; // CSS backdrop filter or overlay styling
  captions: EpisodeCaption[];
  synopsisSnippet: string;
  soundType: "rain" | "suspense" | "heartbeat" | "city" | "drone" | "piano";
};

// Curated 9:16 portrait scene frames for series episodes
const SCENES_MAP: Record<string, Record<number, Partial<EpisodeScene>>> = {
  "the-missing-phone": {
    1: {
      title: "The 7:40 Local",
      scenePoster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-30s.mp4",
      atmosphere: "neon",
      gradeFilter: "contrast(115%) saturate(110%) hue-rotate(-5deg)",
      soundType: "suspense",
      synopsisSnippet: "Maya finds a stranger's vibrating phone on the commuter train seat.",
      captions: [
        { startSec: 1, endSec: 5, speaker: "Train PA", text: "Next stop, Dadar Western line. Stand clear of the doors." },
        { startSec: 6, endSec: 12, speaker: "Maya", text: "Excuse me... did someone leave their phone on this seat?" },
        { startSec: 14, endSec: 20, speaker: "Phone", text: "*Vibrating aggressively* — INCOMING CALL: PRIVATE NUMBER" },
        { startSec: 21, endSec: 26, speaker: "Caller", text: "Don't hand it to anyone, Maya. Walk to coach three now." },
        { startSec: 27, endSec: 30, speaker: "Maya", text: "Who is this?! How do you know my name?!" },
      ],
    },
    2: {
      title: "The Second Ring",
      scenePoster: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-drama-walking.mp4",
      atmosphere: "thriller",
      gradeFilter: "contrast(120%) brightness(95%) saturate(95%)",
      soundType: "heartbeat",
      synopsisSnippet: "Arjun answers on the second ring, but his story doesn't add up.",
      captions: [
        { startSec: 1, endSec: 6, speaker: "Maya", text: "Arjun, I found a phone. The caller said you gave it to them." },
        { startSec: 7, endSec: 14, speaker: "Arjun", text: "Maya, listen to me very carefully. Turn it off and throw it out." },
        { startSec: 15, endSec: 22, speaker: "Maya", text: "Why are you whispering? Where are you right now?" },
        { startSec: 23, endSec: 30, speaker: "Arjun", text: "Just look behind you on the staircase..." },
      ],
    },
    3: {
      title: "The Alleyway Fork",
      scenePoster: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-thriller-night.mp4",
      atmosphere: "neon",
      gradeFilter: "contrast(125%) hue-rotate(10deg)",
      soundType: "city",
      synopsisSnippet: "The phone screen unlocks with an address she visited three years ago.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "Maya", text: "The passcode... it's my old flat number. How is that possible?" },
        { startSec: 8, endSec: 16, speaker: "Voice Note", text: "If you're hearing this, she made it past the railway crossing." },
        { startSec: 17, endSec: 24, speaker: "Maya", text: "Someone has been following me for months." },
      ],
    },
    4: {
      title: "The Confession",
      scenePoster: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=240&q=70",
      atmosphere: "monsoon",
      gradeFilter: "contrast(110%) brightness(90%) saturate(120%)",
      soundType: "rain",
      synopsisSnippet: "VIP: Maya confronts Arjun face-to-face as rain floods the street.",
      captions: [
        { startSec: 1, endSec: 8, speaker: "Arjun", text: "I wasn't trying to scare you. I was trying to keep you away from him." },
        { startSec: 9, endSec: 17, speaker: "Maya", text: "Then whose name is on the SIM card, Arjun? Tell me the truth!" },
        { startSec: 18, endSec: 26, speaker: "Arjun", text: "It's registered to your sister." },
      ],
    },
    5: {
      title: "The Deleted Chats",
      scenePoster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=240&q=70",
      atmosphere: "cctv",
      gradeFilter: "contrast(130%) saturate(85%) hue-rotate(-15deg)",
      soundType: "drone",
      synopsisSnippet: "A cloud backup restores encrypted chat logs from last night.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "System", text: "Syncing 144 archived messages from Cloud Vault..." },
        { startSec: 8, endSec: 15, speaker: "Maya", text: "These messages... they were sent from inside my house." },
        { startSec: 16, endSec: 24, speaker: "Caller", text: "Check the kitchen cabinet. The bottom drawer." },
      ],
    },
    6: {
      title: "Blocked",
      scenePoster: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=240&q=70",
      atmosphere: "thriller",
      gradeFilter: "contrast(115%) brightness(95%)",
      soundType: "suspense",
      synopsisSnippet: "The crucial decision point: trust Arjun or report to the police.",
      captions: [
        { startSec: 1, endSec: 6, speaker: "Maya", text: "Every exit from the station is blocked." },
        { startSec: 7, endSec: 15, speaker: "Arjun", text: "Take my hand. If we run now, we can make the overpass." },
        { startSec: 16, endSec: 22, speaker: "Narrator", text: "Decision moment: Path A or Path B?" },
      ],
    },
    7: {
      title: "Second Chance",
      scenePoster: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=240&q=70",
      atmosphere: "neon",
      gradeFilter: "contrast(120%) saturate(110%)",
      soundType: "city",
      synopsisSnippet: "The stranger finally reveals their face under the bridge.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "Stranger", text: "You didn't recognize my voice, did you Maya?" },
        { startSec: 8, endSec: 15, speaker: "Maya", text: "It can't be you. We buried you two years ago." },
      ],
    },
    8: {
      title: "Last Episode",
      scenePoster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=240&q=70",
      atmosphere: "thriller",
      gradeFilter: "contrast(130%) brightness(90%)",
      soundType: "heartbeat",
      synopsisSnippet: "The shocking season finale twist that alters everything.",
      captions: [
        { startSec: 1, endSec: 8, speaker: "Phone", text: "BATTERY LEVEL: 1% — CALL TERMINATING" },
        { startSec: 9, endSec: 17, speaker: "Maya", text: "Wait! What does the key unlock?!" },
        { startSec: 18, endSec: 25, speaker: "Stranger", text: "Your own front door..." },
      ],
    },
  },

  "rooftop-monsoon": {
    1: {
      title: "Midnight Escape",
      scenePoster: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-drama-walking.mp4",
      atmosphere: "monsoon",
      gradeFilter: "contrast(110%) saturate(115%) hue-rotate(5deg)",
      soundType: "rain",
      synopsisSnippet: "Aisha sneaks to the terrace to escape her wedding countdown.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "Aisha", text: "Nine days left until the wedding, and I can barely breathe down there." },
        { startSec: 8, endSec: 15, speaker: "Stranger", text: "Careful with that rusted latch. It wakes up the whole fourth floor." },
        { startSec: 16, endSec: 23, speaker: "Aisha", text: "Who's there?! What are you doing on this roof?" },
        { startSec: 24, endSec: 32, speaker: "Kabir", text: "Same thing as you... hiding from tomorrow." },
      ],
    },
    2: {
      title: "Shared Tea",
      scenePoster: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-30s.mp4",
      atmosphere: "monsoon",
      gradeFilter: "contrast(105%) brightness(95%) saturate(120%)",
      soundType: "rain",
      synopsisSnippet: "Under a torn plastic tarp, two strangers share silence in the downpour.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "Kabir", text: "Cardamom tea. Drink it before the rain cools it down." },
        { startSec: 8, endSec: 14, speaker: "Aisha", text: "I'm supposed to meet his parents tomorrow morning." },
        { startSec: 15, endSec: 22, speaker: "Kabir", text: "Do you want to?" },
      ],
    },
    3: {
      title: "Thunderclap",
      scenePoster: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-thriller-night.mp4",
      atmosphere: "monsoon",
      gradeFilter: "contrast(115%) brightness(90%)",
      soundType: "rain",
      synopsisSnippet: "The power cuts across the neighborhood. The city goes completely dark.",
      captions: [
        { startSec: 1, endSec: 6, speaker: "Aisha", text: "The entire skyline just disappeared." },
        { startSec: 7, endSec: 14, speaker: "Kabir", text: "Good. For twenty minutes, nobody knows where anyone is." },
      ],
    },
  },

  "floor-nine": {
    1: {
      title: "The 3:04 Reset",
      scenePoster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-thriller-night.mp4",
      atmosphere: "cctv",
      gradeFilter: "contrast(135%) brightness(85%) hue-rotate(85deg) saturate(70%)",
      soundType: "drone",
      synopsisSnippet: "Every night at exactly 3:04 AM, camera 09 resets its timestamp.",
      captions: [
        { startSec: 1, endSec: 6, speaker: "Radio", text: "Control to Guard Vikram. Check corridor B on nine." },
        { startSec: 7, endSec: 14, speaker: "Vikram", text: "Control, the timestamp just jumped from 3:04 back to 3:00." },
        { startSec: 15, endSec: 23, speaker: "Radio", text: "Vikram, who is that standing three feet behind your chair?" },
      ],
    },
    2: {
      title: "Empty Elevator",
      scenePoster: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f6?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f6?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-drama-walking.mp4",
      atmosphere: "thriller",
      gradeFilter: "contrast(130%) brightness(80%) saturate(60%)",
      soundType: "heartbeat",
      synopsisSnippet: "The elevator doors open on floor nine. The hallway is freezing cold.",
      captions: [
        { startSec: 1, endSec: 7, speaker: "Vikram", text: "Floor nine is under renovation. Why did the elevator stop here?" },
        { startSec: 8, endSec: 16, speaker: "Whisper", text: "Don't press the button to go back down..." },
      ],
    },
  },

  "umbrella-hearts": {
    1: {
      title: "Two Under One",
      scenePoster: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80",
      thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=70",
      videoUrl: "/videos/sample-30s.mp4",
      atmosphere: "monsoon",
      gradeFilter: "contrast(105%) saturate(125%)",
      soundType: "piano",
      synopsisSnippet: "Neither of them owns an umbrella by choice. Now they have to share.",
      captions: [
        { startSec: 1, endSec: 6, speaker: "Rhea", text: "You're getting completely soaked on your left shoulder." },
        { startSec: 7, endSec: 14, speaker: "Dev", text: "I don't mind. How far is your bus stop?" },
        { startSec: 15, endSec: 20, speaker: "Rhea", text: "Three miles. If we walk really slowly." },
      ],
    },
  },
};

// Fallback genre-based scene generator for any other series or unlisted episode
const GENRE_POSTERS: Record<string, string[]> = {
  Romance: [
    "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=720&q=80",
  ],
  Thriller: [
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=720&q=80",
  ],
  Mystery: [
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=720&q=80",
  ],
  Supernatural: [
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f6?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=720&q=80",
  ],
  Comedy: [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=720&q=80",
  ],
  Drama: [
    "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=720&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=720&q=80",
  ],
};

/**
 * Returns distinct scene imagery, video loop, captions, and atmosphere for any series episode.
 */
export function getEpisodeScene(seriesSlug: string, episodeNumber: number, fallbackGenres: string[] = ["Drama"]): EpisodeScene {
  const seriesScenes = SCENES_MAP[seriesSlug];
  const custom = seriesScenes?.[episodeNumber];

  const primaryGenre = fallbackGenres[0] ?? "Drama";
  const genrePool = GENRE_POSTERS[primaryGenre] ?? GENRE_POSTERS["Drama"]!;
  const fallbackPoster = genrePool[(episodeNumber - 1) % genrePool.length]!;

  return {
    id: `${seriesSlug}-ep${episodeNumber}`,
    seriesSlug,
    episodeNumber,
    title: custom?.title ?? `Episode ${episodeNumber}`,
    scenePoster: custom?.scenePoster ?? fallbackPoster,
    thumbnail: custom?.thumbnail ?? fallbackPoster.replace("w=720", "w=240"),
    videoUrl: custom?.videoUrl ?? "/videos/sample-30s.mp4",
    atmosphere: custom?.atmosphere ?? (primaryGenre === "Thriller" ? "thriller" : "monsoon"),
    gradeFilter: custom?.gradeFilter ?? "contrast(110%) saturate(105%)",
    captions: custom?.captions ?? [
      { startSec: 2, endSec: 8, speaker: "Protagonist", text: `Scene continues in Episode ${episodeNumber}...` },
      { startSec: 9, endSec: 16, speaker: "Co-Star", text: "Look closely at the shadow by the doorway." },
      { startSec: 18, endSec: 25, speaker: "Voice", text: "Everything changes from this moment onwards." },
    ],
    synopsisSnippet: custom?.synopsisSnippet ?? `Episode ${episodeNumber} scene unfolds with dramatic story revelations.`,
    soundType: custom?.soundType ?? (primaryGenre === "Romance" ? "piano" : "suspense"),
  };
}

/**
 * Synthesizes a subtle, realistic ambient soundscape using Web Audio API.
 * Zero external audio bandwidth needed, instant play/pause response.
 */
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscList: OscillatorNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  public start(soundType: EpisodeScene["soundType"]) {
    if (typeof window === "undefined") return;
    this.stop();

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      // Fade in smoothly to avoid pop
      this.masterGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 1.2);
      this.masterGain.connect(this.ctx.destination);

      if (soundType === "rain") {
        // Synthesize soft rain noise with bandpass filter
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.masterGain);
        noise.start();
        this.noiseNode = noise;
      } else if (soundType === "suspense" || soundType === "heartbeat" || soundType === "drone") {
        // Deep cinematic sub-bass drone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // Low E2 (tense 5th)

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.masterGain);

        osc1.start();
        osc2.start();
        this.oscList = [osc1, osc2];
      } else {
        // Soft romantic warm pad tone
        const osc1 = this.ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(220, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, this.ctx.currentTime);

        osc1.connect(filter);
        filter.connect(this.masterGain);
        osc1.start();
        this.oscList = [osc1];
      }

      this.isPlaying = true;
    } catch {
      // AudioContext policy or restricted
    }
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
      }
      setTimeout(() => {
        this.oscList.forEach((o) => {
          try { o.stop(); o.disconnect(); } catch {}
        });
        this.oscList = [];
        if (this.noiseNode) {
          try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
          this.noiseNode = null;
        }
        if (this.ctx) {
          this.ctx.close().catch(() => {});
          this.ctx = null;
        }
        this.isPlaying = false;
      }, 450);
    } catch {
      this.isPlaying = false;
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
