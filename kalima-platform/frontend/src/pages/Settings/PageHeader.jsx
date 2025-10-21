function PageHeader({ title }) {
    return (
      <div className="relative">
        <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>
        <div className="absolute top-0 left-0 right-0 h-4 bg-yellow-200 -z-10 mt-4"></div>
      </div>
    )
  }
  
  export default PageHeader
  
  