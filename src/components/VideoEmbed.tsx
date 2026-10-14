import { useI18n } from "../i18n";

export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const { tr } = useI18n();
  return (
    <figure className="video-figure">
      <div className="video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <figcaption className="muted">
        {tr("lesson.videoCredit", {
          link: (
            <a key="link" href="https://cinoto.com.br/cubomagico/metodo-de-camadas-com-historias/" target="_blank" rel="noreferrer">
              cinoto.com.br
            </a>
          ),
        })}
      </figcaption>
    </figure>
  );
}
