import re, codecs

al_path = 'e:/GitHub/fekra/kalima-platform/backend/middleware/auditLogger.js'
with codecs.open(al_path, 'r', 'utf8') as f:
    text = f.read()

text = re.sub(r'\s*\{\s*keywords:\s*\["package",\s*"packages"\],\s*type:\s*"package"\s*\},', '', text)
text = re.sub(r'\s*// Special case for packages which have a different structure\s*if \(resourceType === "package"\) \{\s*if \(resData\.package\) \{\s*resourceId = resourceId \|\| resData\.package\._id \|\| resData\.package\.id;\s*resourceName = resData\.package\.name;\s*\} else if \(resData\.packages && resData\.packages\.length\) \{\s*resourceName = \$\{resData\.packages\.length\} packages;\s*\}\s*\}', '', text)
text = re.sub(r' \|\| resData\.package \|\| resData\.packages', '', text)

with codecs.open(al_path, 'w', 'utf8') as f:
    f.write(text)

alc_path = 'e:/GitHub/fekra/kalima-platform/backend/controllers/auditLogController.js'
with codecs.open(alc_path, 'r', 'utf8') as f:
    text = f.read()

# Replace the switch case for package
text = re.sub(r'\s*case "package": \{\s*const packageItem = await Package\.findById\(resourceId\)\.lean\(\);\s*return packageItem\s*\?\s*\{\s*id: packageItem\._id,\s*name: packageItem\.name,\s*type: packageItem\.type,\s*price: packageItem\.price\s*\}\s*:\s*\{ id: resourceId, name: "Deleted Package" \};\s*\}', '', text)
text = re.sub(r'const Package = require\("\.\./models/packageModel"\);\n?', '', text)

with codecs.open(alc_path, 'w', 'utf8') as f:
    f.write(text)

print("done")
