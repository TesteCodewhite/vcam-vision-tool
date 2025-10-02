import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const COCO_CLASSES = {
  vehicles: ["car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "bicycle"],
  animals: ["bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"],
  furniture: ["chair", "couch", "potted plant", "bed", "dining table", "toilet"],
  electronics: ["tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator"],
  sports: ["frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket"],
  kitchen: ["bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl"],
  food: ["banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"],
  accessories: ["backpack", "umbrella", "handbag", "tie", "suitcase"],
  other: ["book", "clock", "scissors", "teddy bear", "hair drier", "toothbrush", "stop sign", "parking meter", "fire hydrant"]
};

const ObjectsList = () => {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-4">
            Objetos Detectáveis
          </h2>
          <p className="text-lg text-muted-foreground">
            Lista completa dos {Object.values(COCO_CLASSES).flat().length} objetos que o sistema pode identificar
          </p>
        </div>

        <div className="space-y-8">
          {/* Destaque para Veículos */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                🚗 Veículos (Detecção Especial)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COCO_CLASSES.vehicles.map((obj) => (
                  <Badge 
                    key={obj} 
                    variant="secondary" 
                    className={`${obj === 'car' || obj === 'motorcycle' ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {obj === 'car' && '🚗 '}
                    {obj === 'motorcycle' && '🏍️ '}
                    {obj}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outras categorias */}
          {Object.entries(COCO_CLASSES).filter(([key]) => key !== 'vehicles').map(([category, objects]) => (
            <Card key={category} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="capitalize text-foreground">
                  {category === 'animals' && '🐾 '}
                  {category === 'furniture' && '🏠 '}
                  {category === 'electronics' && '📱 '}
                  {category === 'sports' && '⚽ '}
                  {category === 'kitchen' && '🍽️ '}
                  {category === 'food' && '🍎 '}
                  {category === 'accessories' && '🎒 '}
                  {category === 'other' && '📚 '}
                  {category.replace('_', ' ')} ({objects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {objects.map((obj) => (
                    <Badge key={obj} variant="outline" className="text-muted-foreground">
                      {obj}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Sistema baseado em COCO Dataset com foco especial em carros e motos para medições precisas
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjectsList;