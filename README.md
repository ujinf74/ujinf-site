# ujinf.net

Personal portfolio site for `ujinf.net`, built as a dependency-free static site for GitHub Pages.

## Why this setup

- GitHub Pages is enough for a personal portfolio, project archive, and lightweight notes.
- Cloudflare can keep DNS, HTTPS, redirects, and future routing centralized.
- A plain static site keeps the first version easy to deploy and replace later if a blog or CMS becomes necessary.

## Deploy

1. Create a public GitHub repository for this site.
2. Push these files to the default branch.
3. In GitHub, enable Pages from the default branch root.
4. In Cloudflare DNS, point `ujinf.net` to GitHub Pages.
5. Keep `CNAME` as `ujinf.net` so GitHub Pages preserves the custom domain.

Recommended DNS records for an apex domain:

```txt
A     ujinf.net  185.199.108.153
A     ujinf.net  185.199.109.153
A     ujinf.net  185.199.110.153
A     ujinf.net  185.199.111.153
CNAME www        ujinf74.github.io
```

After Pages is active, set the custom domain to `ujinf.net` in the repository settings and enable HTTPS.
