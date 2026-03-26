import re, codecs

with codecs.open('e:/GitHub/fekra/kalima-platform/frontend/src/pages/User Dashboard/Admin dashboard/AddNewStuff.jsx', 'r', 'utf8') as f:
    text = f.read()

# remove handlePackageSubmit block
text = re.sub(r'\s*const handlePackageSubmit = async \(e\) => \{.*?(?=\s*const handleLevelSubmit)', '', text, flags=re.DOTALL)

# remove handleUpdatePackage block
text = re.sub(r'\s*const handleUpdatePackage = async \(e\) => \{.*?(?=\s*const handleDeleteUser)', '', text, flags=re.DOTALL)
text = re.sub(r'\s*const handleDeleteUser = .*?\}\s*', '', text, flags=re.DOTALL) # wait! handleUpdatePackage might not exist

# remove activeForm === "package" logic
text = re.sub(r'\s*// Package form state\s*const \[packageData, setPackageData\] = useState\(\{[\s\S]*?\}\)', '', text)

# Just searching for leftover packageData
text = re.sub(r'.*?packageData.*?\n', '', text)
text = re.sub(r'.*?handlePackageSubmit.*?\n', '', text)
text = re.sub(r'.*?createPackage.*?\n', '', text)
text = re.sub(r'.*?deletePackage.*?\n', '', text)
text = re.sub(r'.*?fetchPackages.*?\n', '', text)
text = re.sub(r'.*?updatePackage.*?\n', '', text)
text = re.sub(r'.*?editPackage.*?\n', '', text)


with codecs.open('e:/GitHub/fekra/kalima-platform/frontend/src/pages/User Dashboard/Admin dashboard/AddNewStuff.jsx', 'w', 'utf8') as f:
    f.write(text)

