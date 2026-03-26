import re, codecs

with codecs.open('src/pages/CourseDetails.jsx', 'r', 'utf8') as f:
    text = f.read()

# Fix the syntax error introduced earlier
text = text.replace("border: 1px solid rgba(17,24,39,0.08),", "border: '1px solid rgba(17,24,39,0.08)',")

with codecs.open('src/pages/CourseDetails.jsx', 'w', 'utf8') as f:
    f.write(text)

print("done!")
