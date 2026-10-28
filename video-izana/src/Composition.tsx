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
  verdeBosque: "#4D6004",
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
// Abajo, Instagram, TikTok y Shorts ponen usuario, caption y botones:
// nada importante por debajo de ~480 px (TikTok es la zona más alta).
const SAFE_BOTTOM_UI = 480;

const FPS = 30;
const TRANSITION_FRAMES = 15; // 0.5 s de fundido entre cortes
// Cada escena se solapa con la siguiente durante la transición:
// 5 × 135 − 4 × 15 = 615 frames = 20.5 s. Cada frase queda ~2 s en pantalla.
const SCENE_FRAMES = 135;

type Scene = {
  // Archivo dentro de public/clips (ej. "corte1.mp4"). null = placeholder.
  // Los cortes ya vienen etalonados para igualar luz y color entre sí.
  clip: string | null;
  // Titular grande en lima itálica (se escribe letra por letra).
  headline: string;
  // Frase en crema; las palabras entre *asteriscos* van en itálica.
  subtitle: string;
};

type Props = {
  scenes: Scene[];
  cta: string;
  url: string;
};

// Guion: el empaque no es una caja, es un regalo. Voz de marca en "tú".
const defaultProps: Props = {
  cta: "Pide el tuyo hoy",
  url: "izananaturals.com",
  scenes: [
    { clip: "1-cajas.mp4", headline: "No es un envío", subtitle: "es *un regalo.*" },
    {
      clip: "2-regalo.mp4",
      headline: "Envuelto a mano",
      subtitle: "con flores *y mucho cariño.*",
    },
    {
      clip: "3-productos.mp4",
      headline: "Natural",
      subtitle: "Pequeños gestos, *grandes detalles.*",
    },
    {
      clip: "4-pedidos.mp4",
      headline: "Con calma",
      subtitle: "porque abrirlo también *es cuidarte.*",
    },
    {
      clip: "5-final.mp4",
      headline: "Así llega",
      subtitle: "tu pedido *Izana.*",
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

export const EmpaqueRegalo: React.FC<Props> = ({ scenes, cta, url }) => {
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
              <SceneVideo clip={scene.clip} index={i} />
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
      {/* Velo plano casi-negro: el video se sigue viendo y el texto se lee. */}
      <AbsoluteFill style={{ backgroundColor: "rgba(29, 28, 9, 0.5)" }} />
      <BrandFrame url={url} />
      {/* Los textos van aparte para que no se oscurezcan con el velo. */}
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const isLast = i === scenes.length - 1;
          return [
            <TransitionSeries.Sequence
              key={`x${i}`}
              durationInFrames={SCENE_FRAMES}
            >
              <SceneText scene={scene} index={i} isLast={isLast} cta={cta} />
            </TransitionSeries.Sequence>,
            isLast ? null : (
              <TransitionSeries.Transition
                key={`y${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            ),
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// Logo completo arriba y web abajo, fijos durante todo el video.
const BrandFrame: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, ENTER_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_SOFT,
  });
  const lift = interpolate(enter, [0, 1], [8, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img
        src={staticFile("brand/izana-logo-blanco.png")}
        style={{
          position: "absolute",
          top: SAFE_Y - 60,
          left: "50%",
          height: 110,
          opacity: enter,
          transform: `translate(-50%, ${lift}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: SAFE_BOTTOM_UI,
          textAlign: "center",
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: IZANA.crema,
          opacity: enter,
          transform: `translateY(${-lift}px)`,
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};

const SceneVideo: React.FC<{ clip: string | null; index: number }> = ({
  clip,
  index,
}) => {
  const frame = useCurrentFrame();
  // Ken Burns lento durante toda la escena.
  const scale = interpolate(frame, [0, SCENE_FRAMES], [1.04, 1.1]);

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {clip ? (
        <OffthreadVideo
          src={staticFile(`clips/${clip}`)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Placeholder index={index} />
      )}
    </AbsoluteFill>
  );
};

const SceneText: React.FC<{
  scene: Scene;
  index: number;
  isLast: boolean;
  cta: string;
}> = ({ scene, index, isLast, cta }) => {
  const frame = useCurrentFrame();

  // Los textos entran cuando termina el fundido y salen antes del siguiente.
  const enterAt = index === 0 ? 6 : TRANSITION_FRAMES;
  const typeDone = enterAt + Math.ceil(scene.headline.length / CHARS_PER_FRAME);
  const line = interpolate(frame, [typeDone, typeDone + ENTER_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_SOFT,
  });
  const sub = interpolate(
    frame,
    [typeDone + 4, typeDone + 4 + ENTER_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SOFT },
  );
  const exitAt = SCENE_FRAMES - TRANSITION_FRAMES - 8;
  const exit = isLast
    ? 0
    : interpolate(frame, [exitAt, exitAt + 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_SOFT,
      });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${SAFE_X}px 160px`,
        textAlign: "center",
        opacity: 1 - exit,
      }}
    >
      {isLast ? <Sparkles startAt={typeDone} /> : null}
      <TypedText
        text={scene.headline}
        delay={enterAt}
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontStyle: "italic",
          fontSize: 168,
          lineHeight: 0.98,
          letterSpacing: "-0.02em",
          color: IZANA.lima,
          margin: 0,
        }}
      />
      {/* Línea lima que se dibuja bajo el titular */}
      <div
        style={{
          width: 140 * line,
          height: 3,
          backgroundColor: IZANA.lima,
          margin: "56px 0 48px",
        }}
      />
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 76,
          lineHeight: 1.12,
          color: IZANA.crema,
          opacity: sub,
          transform: `translateY(${8 * (1 - sub)}px)`,
        }}
      >
        {parseEmphasis(scene.subtitle).map((seg, i) => (
          <span
            key={i}
            style={seg.italic ? { fontStyle: "italic", fontWeight: 400 } : {}}
          >
            {seg.text}
          </span>
        ))}
      </div>
      {isLast ? <CtaPill label={cta} delay={typeDone + 24} /> : null}
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

// Velocidad de escritura del titular (letras por frame, 30 fps).
const CHARS_PER_FRAME = 0.8;

// Titular tipo máquina de escribir, con cursor lima parpadeante.
const TypedText: React.FC<{
  text: string;
  delay: number;
  style: React.CSSProperties;
}> = ({ text, delay, style }) => {
  const frame = useCurrentFrame();
  const typed = Math.max(
    0,
    Math.min(text.length, Math.floor((frame - delay) * CHARS_PER_FRAME)),
  );
  const isTyping = typed > 0 && typed < text.length;
  // Fijo mientras escribe; parpadea antes de empezar y al terminar.
  const cursorOn = isTyping || Math.floor(frame / 15) % 2 === 0;

  return (
    <h1 style={style}>
      {text.slice(0, typed)}
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: "0.8em",
          marginLeft: 6,
          verticalAlign: "-0.04em",
          backgroundColor: IZANA.lima,
          opacity: cursorOn ? 1 : 0,
        }}
      />
      {/* El resto ocupa su lugar invisible para que las líneas no salten. */}
      <span style={{ color: "transparent" }}>{text.slice(typed)}</span>
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
        marginTop: 64,
        display: "inline-flex",
        borderRadius: 999,
        padding: "28px 56px",
        fontFamily: poppins,
        fontWeight: 600,
        fontSize: 34,
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
  { x: 860, y: 560, size: 60 },
  { x: 960, y: 650, size: 32 },
  { x: 110, y: 1250, size: 40 },
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
