import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  interpolate,
  OffthreadVideo,
  spring,
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

// Poppins (fuente de marca) en public/fonts: el render no depende de internet.
const poppins = "Poppins";
for (const weight of ["400", "500", "700"]) {
  loadFont({
    family: poppins,
    weight,
    url: staticFile(`fonts/Poppins-${weight}.woff2`),
  });
}

const COLORS = {
  cream: "#F6F1E9",
  sage: "#5E7356",
  gold: "#C9A96E",
  ink: "#2B2A27",
};

const FPS = 30;
const TRANSITION_FRAMES = 15; // 0.5 s de transición entre cortes
// Cada escena se solapa con la siguiente durante la transición:
// 5 × 102 − 4 × 15 = 450 frames = 15 s.
const SCENE_FRAMES = 102;

type Scene = {
  // Archivo dentro de public/clips (ej. "corte1.mp4"). null = placeholder.
  clip: string | null;
  kicker?: string;
  title: string;
};

type Props = {
  scenes: Scene[];
  brand: string;
  cta: string;
};

// Guion: el empaque no es una caja, es un regalo.
const defaultProps: Props = {
  brand: "Izana Naturals",
  cta: "Pide el tuyo hoy",
  scenes: [
    { clip: "1-cajas.mp4", kicker: "En Izana", title: "No empacamos pedidos." },
    { clip: "2-regalo.mp4", title: "Envolvemos regalos." },
    { clip: "3-productos.mp4", kicker: "Cada detalle", title: "hecho a mano, con calma." },
    {
      clip: "4-pedidos.mp4",
      kicker: "Porque abrirlo",
      title: "también es parte de cuidarte.",
    },
    { clip: "5-final.mp4", title: "Tu pedido merece llegar así." },
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
  interpolate(
    f,
    [0, 10, total - 30, total],
    [0, 0.8, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

// Transición que entra en cada corte (después de la escena i).
// Todas son fundidos para un look sobrio y delicado.
const TRANSITIONS: {
  presentation: TransitionPresentation<Record<string, unknown>>;
  timing: TransitionTiming;
}[] = [
  {
    presentation: fade(),
    timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }),
  },
];

export const EmpaqueRegalo: React.FC<Props> = ({ scenes, brand, cta }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
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
              <SceneView
                scene={scene}
                index={i}
                isLast={isLast}
                brand={brand}
                cta={cta}
              />
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
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{
  scene: Scene;
  index: number;
  isLast: boolean;
  brand: string;
  cta: string;
}> = ({ scene, index, isLast, brand, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom lento tipo "ken burns" durante toda la escena.
  const scale = interpolate(frame, [0, SCENE_FRAMES], [1.04, 1.12]);

  // Los textos salen justo antes de que empiece la transición.
  const exitStart = SCENE_FRAMES - TRANSITION_FRAMES - 10;
  const exit = isLast
    ? 0
    : interpolate(frame, [exitStart, exitStart + 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      });

  // Escenas que llegan con transición: el texto espera a que termine.
  const textDelay = index === 0 ? 4 : TRANSITION_FRAMES;
  const kickerIn = spring({
    frame: frame - textDelay,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {scene.clip ? (
          <OffthreadVideo
            src={staticFile(`clips/${scene.clip}`)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Placeholder index={index} />
        )}
      </AbsoluteFill>

      {/* Degradado para que el texto se lea sobre cualquier corte */}
      <AbsoluteFill
        style={{
          background: isLast
            ? "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(20,18,15,0.85) 70%)"
            : "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(20,18,15,0.75) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 90px 300px",
          opacity: 1 - exit,
          transform: `translateY(${-40 * exit}px)`,
          filter: `blur(${6 * exit}px)`,
        }}
      >
        {scene.kicker ? (
          <div
            style={{
              fontFamily: poppins,
              fontWeight: 600,
              fontSize: 42,
              // Las letras se abren mientras aparece.
              letterSpacing: interpolate(kickerIn, [0, 1], [18, 6]),
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: 24,
              opacity: kickerIn,
            }}
          >
            {scene.kicker}
          </div>
        ) : null}
        <AnimatedTitle
          text={scene.title}
          delay={textDelay + (scene.kicker ? 6 : 0)}
        />
        {isLast ? <EndCard brand={brand} cta={cta} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Velocidad de escritura del título (letras por frame, 30 fps).
const CHARS_PER_FRAME = 0.9;

// Título tipo máquina de escribir, con cursor dorado parpadeante.
const AnimatedTitle: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const typed = Math.max(
    0,
    Math.min(text.length, Math.floor((frame - delay) * CHARS_PER_FRAME)),
  );
  const isTyping = typed > 0 && typed < text.length;
  // Fijo mientras escribe; parpadea antes de empezar y al terminar.
  const cursorOn = isTyping || Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: 96,
        lineHeight: 1.15,
        letterSpacing: -1,
        color: COLORS.cream,
      }}
    >
      {text.slice(0, typed)}
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: "0.9em",
          marginLeft: 6,
          verticalAlign: "-0.08em",
          backgroundColor: COLORS.gold,
          opacity: cursorOn ? 1 : 0,
        }}
      />
      {/* El resto ocupa su lugar invisible para que las líneas no salten. */}
      <span style={{ color: "transparent" }}>{text.slice(typed)}</span>
    </div>
  );
};

const EndCard: React.FC<{ brand: string; cta: string }> = ({ brand, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 45, fps, config: { damping: 14 } });
  const lineWidth = interpolate(frame, [38, 68], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ marginTop: 56 }}>
      <div
        style={{ height: 4, width: lineWidth, backgroundColor: COLORS.gold }}
      />
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 400,
          fontSize: 64,
          color: COLORS.cream,
          marginTop: 32,
          opacity: pop,
        }}
      >
        {brand}
      </div>
      <div
        style={{
          display: "inline-block",
          marginTop: 32,
          padding: "26px 56px",
          borderRadius: 999,
          backgroundColor: COLORS.sage,
          color: COLORS.cream,
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 44,
          transform: `scale(${pop})`,
          transformOrigin: "left center",
        }}
      >
        {cta}
      </div>
    </div>
  );
};

// Se muestra mientras no haya un corte cargado para la escena.
const Placeholder: React.FC<{ index: number }> = ({ index }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.sage} 0%, #3E4D39 100%)`,
        alignItems: "center",
        paddingTop: 420,
      }}
    >
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 500,
          fontSize: 40,
          color: "rgba(246,241,233,0.6)",
          border: "3px dashed rgba(246,241,233,0.4)",
          borderRadius: 24,
          padding: "28px 48px",
        }}
      >
        Corte {index + 1}
      </div>
    </AbsoluteFill>
  );
};
