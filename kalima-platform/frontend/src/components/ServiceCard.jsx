function ServiceCard({ icon: Icon, title, subtitle, description }) {
  return (
    <div className="text-center hover:scale-105 hover:shadow-xl shadow-lg duration-500 p-6 bg-base-100 rounded-lg h-full flex flex-col justify-between">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-base-200">
          <Icon className="h-8 w-8 text-primary animate-spin-y" />
        </div>
      </div>
      <h4 className="font-bold text-lg mb-2">{title}</h4>
      <h5 className="text-primary font-medium text-lg mb-4">{subtitle}</h5>
      <p className="text-base text-base-content/70 mb-6">{description}</p>
      <div className="w-full border-b-4 border-primary"></div>
    </div>
  );
}
export default ServiceCard;