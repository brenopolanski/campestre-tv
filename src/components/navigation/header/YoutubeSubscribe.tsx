import { YoutubeIcon } from '@/components/shared/Icons'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

export const YoutubeSubscribe = () => {
  return (
    <Button
      aria-label="Inscrever-se no canal do YouTube"
      className="rounded-none border border-border"
      nativeButton={false}
      render={
        <a
          href={`${siteConfig.links.youtube}?sub_confirmation=1`}
          rel="noopener noreferrer"
          target="_blank"
        />
      }
      size="icon"
      variant="ghost"
    >
      <YoutubeIcon />
    </Button>
  )
}
