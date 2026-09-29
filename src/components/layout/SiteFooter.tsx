const SiteFooter = () => {
  return (
    <footer
      className="flex flex-col gap-6 px-8 py-10 sm:flex-row sm:items-center sm:justify-between"
      id="contato"
    >
      <div>
        <p className="label-caps text-muted-foreground">campestre.tv</p>
        <span className="mt-3 block h-px w-8 bg-foreground/60" />
      </div>
      <p className="label-caps text-muted-foreground">
        Tênis <span className="px-2">•</span> Comunidade <span className="px-2">•</span> Qualidade
        de vida
      </p>
    </footer>
  )
}

export { SiteFooter }
