import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import {
  linearTiming,
  TransitionPresentation,
  TransitionSeries,
  TransitionTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// Poppins oficial del sistema de diseño Izana (public/fonts).
// La marca usa solo 400, 400 itálica, 600 y 600 itálica en este video.
const poppins = "Poppins";
for (const [weight, style] of [
  ["400", "normal"],
  ["400", "italic"],
  ["600", "normal"],
  ["600", "italic"],
] as const) {
  loadFont({
    family: poppins,
    weight,
    style,
    url: staticFile(
      `fonts/Poppins-${weight}${style === "italic" ? "-italic" : ""}.woff2`,
    ),
  });
}

// Tokens del Izana Naturals Design System (colors_and_type.css).
const IZANA = {
  lima: "#9EAC13",
  lima700: "#4F5609",
  verdeBosque: "#4D6004",
  olivaOscuro: "#615E21",
  crema: "#EFEFDF",
  casiNegro: "#1D1C09",
  magenta: "#AC139E",
};

// Movimiento de marca: "soft out", sin rebotes ni sobreimpulso.
const EASE_SOFT = Easing.bezier(0.32, 0.72, 0, 1);
const ENTER_FRAMES = 12; // 400 ms, duración "hero"

// Márgenes seguros de story: 72 px a los lados, 250 px arriba y abajo.
const SAFE_X = 72;
const SAFE_Y = 250;

const FPS = 30;
const TRANSITION_FRAMES = 15; // 0.5 s de fundido entre cortes
// Cada escena se solapa con la siguiente durante la transición:
// 5 × 102 − 4 × 15 = 450 frames = 15 s.
const SCENE_FRAMES = 102;

type Scene = {
  // Archivo dentro de public/clips (ej. "corte1.mp4"). null = placeholder.
  clip: string | null;
  eyebrow: string;
  // Las palabras entre *asteriscos* van en itálica (frase de énfasis).
  title: string;
};

type Props = {
  scenes: Scene[];
  cta: string;
};

// Guion: el empaque no es una caja, es un regalo. Voz de marca en "tú".
const defaultProps: Props = {
  cta: "Pide el tuyo hoy",
  scenes: [
    { clip: "1-cajas.mp4", eyebrow: "En Izana", title: "No empacamos *pedidos.*" },
    { clip: "2-regalo.mp4", eyebrow: "Con amor", title: "Envolvemos *regalos.*" },
    {
      clip: "3-productos.mp4",
      eyebrow: "Cada detalle",
      title: "Hecho a mano, *con calma.*",
    },
    {
      clip: "4-pedidos.mp4",
      eyebrow: "Porque abrirlo",
      title: "también es parte *de cuidarte.*",
    },
    {
      clip: "5-final.mp4",
      eyebrow: "Kits de regalo",
      title: "Tu pedido merece *llegar así.*",
    },
  ],
};

export const MyComposition = () => {
  return (
    <Composition
      id="EmpaqueRegalo"
      component={EmpaqueRegalo}
      durationInFrames={
        SCENE_FRAMES * defaultProps.scenes.length -
        TRANSITION_FRAMES * (defaultProps.scenes.length - 1)
      }
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

// Fade-in corto y fade-out en el último segundo del video.
const musicVolume = (f: number, total: number) =>
  interpolate(f, [0, 10, total - 30, total], [0, 0.8, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Transición que entra en cada corte (después de la escena i).
// La marca pide fundidos: nada de deslizamientos ni giros.
const TRANSITIONS: {
  presentation: TransitionPresentation<Record<string, unknown>>;
  timing: TransitionTiming;
}[] = [
  {
    presentation: fade(),
    timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }),
  },
];

export const EmpaqueRegalo: React.FC<Props> = ({ scenes, cta }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: IZANA.casiNegro }}>
      <Audio
        src={staticFile("musica.mp3")}
        volume={(f) => musicVolume(f, durationInFrames)}
      />
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const isLast = i === scenes.length - 1;
          const t = TRANSITIONS[i % TRANSITIONS.length];
          return [
            <TransitionSeries.Sequence
              key={`s${i}`}
              durationInFrames={SCENE_FRAMES}
            >
              <SceneView scene={scene} index={i} isLast={isLast} cta={cta} />
            </TransitionSeries.Sequence>,
            isLast ? null : (
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={t.presentation}
                timing={t.timing}
              />
            ),
          ];
        })}
      </TransitionSeries>
      <BrandHeader />
    </AbsoluteFill>
  );
};

// Logo completo en blanco arriba, fijo durante todo el video.
const BrandHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, ENTER_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_SOFT,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Velo superior de la plantilla "Story · Tarjeta flotante" */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 520,
          background:
            "linear-gradient(180deg, rgba(29,28,9,0.55), rgba(29,28,9,0))",
        }}
      />
      <Img
        src={staticFile("brand/izana-logo-blanco.png")}
        style={{
          position: "absolute",
          top: SAFE_Y,
          left: "50%",
          height: 88,
          opacity: enter,
          transform: `translate(-50%, ${interpolate(enter, [0, 1], [8, 0])}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{
  scene: Scene;
  index: number;
  isLast: boolean;
  cta: string;
}> = ({ scene, index, isLast, cta }) => {
  const frame = useCurrentFrame();

  // Ken Burns lento durante toda la escena.
  const scale = interpolate(frame, [0, SCENE_FRAMES], [1.04, 1.1]);

  // La tarjeta entra cuando termina el fundido y sale antes del siguiente.
  const enterAt = index === 0 ? 6 : TRANSITION_FRAMES;
  const enter = interpolate(frame, [enterAt, enterAt + ENTER_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_SOFT,
  });
  const exitAt = SCENE_FRAMES - TRANSITION_FRAMES - 10;
  const exit = isLast
    ? 0
    : interpolate(frame, [exitAt, exitAt + 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_SOFT,
      });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {scene.clip ? (
          <OffthreadVideo
            src={staticFile(`clips/${scene.clip}`)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // Imagen de marca: luz cálida, saturación −15 %.
              filter: "saturate(0.85) sepia(0.06)",
            }}
          />
        ) : (
          <Placeholder index={index} />
        )}
      </AbsoluteFill>

      {isLast ? <Sparkles startAt={enterAt + 50} /> : null}

      {/* Tarjeta crema flotante */}
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          right: SAFE_X,
          bottom: SAFE_Y,
          backgroundColor: IZANA.crema,
          borderRadius: 32,
          padding: "64px 64px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          opacity: enter * (1 - exit),
          transform: `translateY(${8 * (1 - enter) - 8 * exit}px)`,
        }}
      >
        <span
          style={{
            fontFamily: poppins,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: IZANA.lima700,
          }}
        >
          {scene.eyebrow}
        </span>
        <TypedTitle text={scene.title} delay={enterAt + 8} />
        {isLast ? <CtaPill label={cta} delay={enterAt + 46} /> : null}
      </div>
    </AbsoluteFill>
  );
};

// Separa "texto *énfasis*" en tramos roman / itálica.
const parseEmphasis = (text: string) =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*")
        ? { text: part.slice(1, -1), italic: true }
        : { text: part, italic: false },
    );

// Velocidad de escritura del título (letras por frame, 30 fps).
const CHARS_PER_FRAME = 1.1;

// Título tipo máquina de escribir: roman 600 + frase de énfasis en itálica.
const TypedTitle: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const segments = parseEmphasis(text);
  const total = segments.reduce((n, s) => n + s.text.length, 0);
  const typed = Math.max(
    0,
    Math.min(total, Math.floor((frame - delay) * CHARS_PER_FRAME)),
  );
  const isTyping = typed > 0 && typed < total;
  // Fijo mientras escribe; parpadea antes de empezar y al terminar.
  const cursorOn = isTyping || Math.floor(frame / 15) % 2 === 0;

  const cursor = (
    <span
      key="cursor"
      style={{
        display: "inline-block",
        width: 6,
        height: "0.85em",
        marginLeft: 4,
        verticalAlign: "-0.06em",
        backgroundColor: IZANA.lima,
        opacity: cursorOn ? 1 : 0,
      }}
    />
  );

  let remaining = typed;
  const parts: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    const shown = Math.max(0, Math.min(seg.text.length, remaining));
    remaining -= shown;
    const style: React.CSSProperties = seg.italic
      ? { fontStyle: "italic", fontWeight: 400, color: IZANA.olivaOscuro }
      : {};
    parts.push(
      <span key={`v${i}`} style={style}>
        {seg.text.slice(0, shown)}
      </span>,
    );
    // El cursor va justo después de la última letra escrita.
    if (shown < seg.text.length && !parts.includes(cursor)) {
      parts.push(cursor);
    }
    // El resto ocupa su lugar invisible para que las líneas no salten.
    parts.push(
      <span key={`h${i}`} style={{ ...style, color: "transparent" }}>
        {seg.text.slice(shown)}
      </span>,
    );
  });
  if (!parts.includes(cursor)) {
    parts.push(cursor);
  }

  return (
    <h1
      style={{
        margin: 0,
        fontFamily: poppins,
        fontWeight: 600,
        fontSize: 96,
        lineHeight: 1.02,
        letterSpacing: "-0.01em",
        color: IZANA.verdeBosque,
      }}
    >
      {parts}
    </h1>
  );
};

// CTA único en magenta (color de contraste, ≤10 % de la pieza).
const CtaPill: React.FC<{ label: string; delay: number }> = ({
  label,
  delay,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + ENTER_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_SOFT,
  });

  return (
    <span
      style={{
        alignSelf: "flex-start",
        marginTop: 8,
        display: "inline-flex",
        borderRadius: 999,
        padding: "26px 48px",
        fontFamily: poppins,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#FFFFFF",
        backgroundColor: IZANA.magenta,
        opacity: p,
        transform: `translateY(${8 * (1 - p)}px)`,
      }}
    >
      {label}
    </span>
  );
};

// Destellos de 4 puntas (recurso de marca), sueltos y asimétricos.
const SPARKLES = [
  { x: 860, y: 820, size: 56 },
  { x: 960, y: 905, size: 30 },
  { x: 110, y: 870, size: 38 },
];

const Sparkles: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {SPARKLES.map((s, i) => {
        const p = interpolate(
          frame,
          [startAt + i * 4, startAt + i * 4 + ENTER_FRAMES],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SOFT },
        );
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              opacity: p,
              transform: `translateY(${8 * (1 - p)}px)`,
            }}
          >
            <path
              d="M12 1 Q12.6 9.4 19 11 Q12.6 12.6 12 23 Q11.4 12.6 5 11 Q11.4 9.4 12 1Z"
              fill={IZANA.lima}
            />
          </svg>
        );
      })}
    </>
  );
};

// Se muestra mientras no haya un corte cargado para la escena.
const Placeholder: React.FC<{ index: number }> = ({ index }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: IZANA.verdeBosque,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 40,
          color: IZANA.crema,
          border: `1px solid ${IZANA.crema}`,
          borderRadius: 12,
          padding: "28px 48px",
        }}
      >
        Corte {index + 1}
      </div>
    </AbsoluteFill>
  );
};
