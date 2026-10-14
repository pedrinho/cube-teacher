import { useI18n } from "../i18n";

interface Props {
  videoId: string;
  title: string;
  /** Page of the lesson this video belongs to on Cinoto's site. */
  sourceUrl: string;
}

export function VideoEmbed({ videoId, title, sourceUrl }: Props) {
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
            <a key="link" href={sourceUrl} target="_blank" rel="noreferrer">
              cinoto.com.br
            </a>
          ),
        })}
      </figcaption>
    </figure>
  );
}
