const cardTones = ['blue', 'silver', 'red', 'green', 'gold', 'violet']

function getTone(value) {
  const hash = [...String(value)].reduce((total, character) => total + character.charCodeAt(0), 0)
  return cardTones[hash % cardTones.length]
}

export function mapDatabaseCar(car) {
  return {
    id: car.id,
    make: car.make || 'Unknown make',
    model: car.model || 'Unknown model',
    year: Number(car.year) || 0,
    price: Number(car.price) || 0,
    mileage: car.mileage == null ? null : Number(car.mileage),
    fuel: car.fuel_type || 'Not specified',
    transmission: car.transmission || 'Not specified',
    engine: car.engine || 'Not specified',
    power: car.power_hp == null ? 'Not specified' : `${car.power_hp} hp`,
    location: car.location || 'Not specified',
    description: car.description || 'No vehicle description is available.',
    imageUrl: car.image_url || null,
    tone: getTone(car.make),
    isDemo: false,
    ownerId: car.owner_id || null,
  }
}
