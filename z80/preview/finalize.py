"""Turn the Vite single-file build into an Artifact page body (host adds the document shell)."""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open("dist/index.html").read()
a = s.index('<script type="module" crossorigin>')
style_start = s.index('<style rel="stylesheet" crossorigin>')
b = s.rindex("</script>", a, style_start) + len("</script>")
script = s[a:b]
c = s.index("</style>", style_start) + len("</style>")
style = s[style_start:c].replace(' rel="stylesheet" crossorigin', "")
fonts = s[s.index('<link rel="preconnect"'):s.index('<div id="root">')]
out = "\n".join([
    "<title>Z80.si</title>",
    '<meta name="description" content="Describe the outcome. Z80 assembles and coordinates the AI workforce to get it done.">',
    fonts.strip(),
    style,
    '<div id="root"></div>',
    script.replace('<script type="module" crossorigin>', '<script type="module">'),
])
open("dist/z80-preview.html", "w").write(out)
print(len(out), "bytes")
