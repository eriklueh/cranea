/**
 * Listas de palabras de Palabra, escritas a mano para este proyecto (sin datasets externos).
 *
 * - ANSWERS: palabras comunes y aptas para todo público que pueden ser la palabra oculta.
 *   Sustantivos, adjetivos en su forma base y verbos en infinitivo. Sin plurales ni conjugaciones.
 *   Se escriben con tildes para mostrarlas bien al final de la partida.
 * - Extras: palabras válidas para probar que nunca son la respuesta (plurales, conjugaciones,
 *   femeninos, palabras menos comunes o con doble sentido).
 *
 * Todo se compara normalizado (ver normalize.ts): sin tildes ni diéresis, con la Ñ como letra propia.
 * Cambiar ANSWERS cambia los diarios futuros: el diario elige por índice dentro de la lista ordenada.
 */
import { normalizeWord, isPlayableWord } from "./normalize";

const ANSWERS_RAW = `
ábaco abeja abeto abono abril abrir acaso acera acero ácido actor adiós adobe aforo agrio agudo aguja ahora ajeno alado
álamo albor aldea alero aleta alfil aliño altar alzar ámbar ameno amigo ancho ancla andar andén anexo ángel ánimo antes
anual añejo apego ápice apodo apoyo apuro arado araña árbol ardor arena arepa arete armar arnés aroma arpón arroz asado
asilo astro atajo ático atlas atrás atril audaz autor avaro ávido avena avión aviso axila ayuda ayuno azada
bahía baile bajar balde balón balsa bambú banco banda bañar barba barca barco barra barro batir bazar beber bello berro
besar bidón bingo blusa boina bolsa bolso borde botín botón boxeo brasa bravo brazo breve brisa broma brote bruja bruma
bucle budín bueno bufón bulto burla burro buque busto buzón
caber cable cabra cacao cacto caída cajón caldo calle calma calor campo canal canoa canto cañón capaz cardo carne carpa
carro carta casco cauce causa cavar cazar cebra cedro ceder ceibo celda cenar censo cerca cerco cerdo cerro cesta cesto
cetro chapa chico chivo choza ciclo cielo cifra cinco cinta cinto circo cisne citar civil clara claro clase clave clavo
clima cloro cobra cobre coche cofre cojín colmo color comer común conde copia copla coral corte corto corzo coser costa
costo crear crema creer criar cromo cruce crudo cuero cueva culpa cuota cupón curar curso curva cutis
danza dardo dátil deber débil debut decir dedal dejar delta denso deseo deuda diana dicha dieta digno disco diván doble
dócil dolor domar donar dorar dorso dosis drama ducha dudar duelo dueño dulce duque durar
ébano echar élite enano enero enojo envío época erizo error espía esquí estar etapa ética éxito
fácil faena falda fallo falso falta fango farol fauna favor fecha feliz fénix feria feroz fibra ficha fideo fiera final
finca firma firme flama fleco flojo flora flota fluir flujo fogón folio fondo forja forma fósil frase freír freno fresa
frito fruta fruto fuego funda furia furor
gaita galgo gallo gamba ganar ganso garbo garra garza gasto genio gente gesto girar globo gnomo golfo golpe gorra gorro
gozar grada grado gramo grano grasa grato grava grave grifo gripe grito grupo gruta grumo guapo guiar guion guiño guiso
gusto
habla hábil hacer hacha hebra hecho helar helio héroe hiena hielo hilar himno hogar hondo hongo honor horno hotel hueco
hueso huevo huida humor
ícono ideal ídolo igual ileso impar
jabón jalea jamón jaque jarra jaula jerga joven juego jugar julio junco junio junta junto jurar justo
kayak koala
labio labor lacio lanza lápiz lapso largo larva láser latir lavar leche legal legua lejos lente lento letra libra libre
liceo libro líder lijar limar limbo limón lince lindo línea lirio lista listo litro llama llano llave lleno local locro
logro lucha lucir lugar lunar lunes
madre magia malla malva mambo mamut mando manga mango manso manta manto marca marco marea mareo marzo matiz mayor mecer
mecha media medio medir mejor melón menor mente menta metal meter metro miedo milla mimar mirar mirlo mismo mitad mixto
mojar molde moler momia monja monje monte monto moral morsa mosca motor mover mucho mudar mueca muela mujer multa mundo
mural museo musgo muslo mutuo
nácar nacer nadar nadie naipe nardo nariz nasal natal naval negar negro nevar nicho nieto nieve ninfa niñez nivel noble
noche nogal norte notar novio nueve nuera nuevo
oasis ocaso oeste ojota oliva olivo omega ópera opaco orden oreja oruga osado ostra otoño óvalo oveja óxido ozono
ñandú ñoqui
pacto padre pagar palco palma palta pampa panal panda panel panza pañal papel parar pardo pared parra parte pasar paseo
pasta pasto patín patio pausa pecho pedal pedir pegar peine pelar pelea penal peral perla perno perro pesar pesca pesto
piano picar pieza pilar pinar pinta pinza piñón piojo pisar pista pitón pizza placa plaga plano plata plato playa plaza
plazo pleno plomo pluma pobre podar poder podio poema poeta polar polca polea polen pollo poner poste potro prado presa
primo prisa prosa pudín pulga pulir pulpo pulso punta punto puzle
queja quena queso
rabia racha radar radio rampa rango rasgo ratón rayar razón recta recto regar regla reina reino reloj remar renta resta
resto retar revés rezar riego rigor riñón risco ritmo rival rizar roble robot rocío rodar rodeo rogar rollo ronda rosal
rosca rubio rubor rueda rugby rugir ruido ruina rumba rumbo rumor rural
saber sabio sabor sacar saldo salir salón salsa salto salud sanar sauce sauna savia secar selva sello senda señal señor
sepia serie serio siete siglo signo silla simio sismo sitio sobre socio sodio solar sonar sonda soñar soplo sorbo suave
subir sucio sudar sudor suela suelo suero sueño sumar surco susto sutil
tabla tacón tacto talco talla tallo talón tamal tanda tango tapiz tapir tapón tarde tarea tarta tazón techo tecla tejer
tejón telar telón temer temor tenaz tener tenis tenor tenso tenue termo terso tesis texto tiara tibio tigre tilde timón
tinta tirar titán tocar toldo tomar toque tórax torno torpe torre tosco toser total traer traje trama trapo trato trazo
trece tribu trigo trino trono tropa trote trozo truco trufa tucán túnel turno tutor
unión untar usado usual
vacío vagar vagón vaina valer valla valle valor vapor vasto vejez velar veloz venda venir venta veraz verbo verde verja
verso viaje video viejo vigía vigor villa viola virus visor vista vital vivir vocal volar voraz votar vuelo
yegua yerba yerno yogur
zanja zarza zorro zurdo
`;

/** Sustantivos y adjetivos de cuatro letras terminados en vocal: su plural (+s) es una palabra válida de cinco. */
const FOUR_RAW = `
abra agua aire alba alga alma alta alto amor ancha apio arca arco área arma arpa asno ateo aula auto ave baja bajo bala
baño bata bebé beso bici boca boda bola bota bote brea buey bota búho cabo cada café caja cama cana caña capa cara caro
casa caso cava cazo ceja cena cepa cera cero cima cine cita coco codo cola copa coro cosa cuba cubo cuna cura
dado dama dato dedo dios diva duda duna duro eco ella ello ente eje era foca foto fuga gafa gajo gala gana gasa gato
gema giro goma gota gozo gula hada haba hija hijo hoja hora hoya huso idea isla jefa jefe jota joya jugo kilo lado lago
lama lana lata lava lazo leño lima lino lira lisa liso lobo loco lodo loma lomo lona loro lote lucha luna lupa luto
mago maja malo mamá mano mapa mate maya mayo mazo media mesa meta mina mira misa mito moda modo mofa mono mora moto moño
mozo mudo mula muro nabo nada nave nena nene niña niño nota nube nuca nudo obra ocre olla onda orca oso pala palo
papá papa paso pata pato pavo peca pelo pena peña pera piña pino pipa pisa piso pomo poro pozo puma puño puro rata
raya rayo rama ramo rana rata rayo remo reno rica rico rifa rima risa roca roce rojo rojo rosa rubí rudo rueda ruta sala
sapo seda sede seno seta silo sitio soga sopa suma tapa taza tela tema tío tía tiro toga tomo tono topo toro tubo tuna
uña urna vaca vaho vale vara vaso vela vena vino viña voto yate yema yeso zona
`;

/** Adjetivos y nombres de la lista de respuestas en -o con femenino en -a (válidos para probar). */
const FEMININE_RAW = `
agudo ajeno alado ameno amigo ancho añejo avaro ávido bello bravo bueno chico claro corto crudo denso digno falso flojo
frito guapo hondo hueco justo lacio largo lento lindo listo lleno mismo mixto mucho mutuo negro nieto novio nuevo opaco
osado pardo pleno primo recto rubio sabio serio sucio tenso terso tibio tosco usado vacío vasto viejo zurdo
`;

/** Otras palabras válidas para probar: conjugaciones, plurales, palabras menos comunes y de uso delicado. */
const EXTRA_RAW = `
abajo abeto abran abren abres abrió abuso acabo acaba acabe acoso acta actos acuda adiós afuera agita aguas ahogo
ahoga ajuar alces alega algas algún alias almas altas altos amaba amada amado amaré amase ambas ambos amén ancas
andan andas anduve anima antro años apaga apila apoya apuro aquel árabe arcos ardía ardía arena armas aros arras
asaba asoma atado atrás atún aunar aves avisa ayudo azote azota
bache baila bailo bajan bajas bajos balas bancos barón basal basta bates bebas beben bebes bebía belga besos
bicho birra bizco bloque bocas bocha bodas bolas bomba bonos borra bravas bravo bruto buena bucal buena burgo busca
busco
cabía caben cacho caiga caigo cajas calvo calla callo camas canas canta cantó caños capas caras carey caspa casas
casos causó cazos cejas celos cenit cerda cerco cesar chata chato chicas chile china chino choca choco chupa cifras
cines cirio citas clavó cobra cocer cocos codos coger colas colar combo comen comes comía comió compra conga concha
copas coros corra corre cosas creen crees creía creyó crías cubos cuales cueza culto cumbia curas cursi cuyas cuyos
dadas dados damas dando datos dedos dejan dejas dejes dejó desde días dicen dices dicho diera digas digan dígalo
dimos diosa dioses dirán domos donde dónde dosis dotes dudas dudan dunas durmió
echan echas ellas ellos enero entra entre envía errar esas esos estás están estas estos estoy estuve
evita exige extra
faros feos fiaca fichó fijar fijas fijos filas finas finos firmó fiaba flaca flaco flaca focos fotos fuera
fugas fumar fusil
gafas galán ganas gatos genes giros gocen gordo gorda gotas gozan grúas guías gusta gusto
había habló hacen haces hacía hadas hagan hagas halla hasta hayan hayas hecha hemos herir hijas hijos hilos hojas
horas huyen
ideas iglús ilesa islas
jamás jarro jefas jefes jirón joyas juega jueza jugos junta jurado
lados lagos lamer latas lavas lazos leían leído lemas lenta leñas lícito ligar ligas limas licor llaga llega llegó
llena lleva llevó lobos locos lomas loros lotes lucen luces lucro lunas lupas
magos malas malos mamar manda manos mapas mares marte matar mates mayas mazos mejor menos meses metas metió mieles
minas miran miras mirón misas mitos modas modos monos moras morir morro motín motos muela mucha mudas mulas muros
nabos nacen nació nadan nadas naves negra nenes nidos niñas niños notas nubes nudos nunca
obras ocres ollas ondas orcas osada otras otros
padres pagan pagas pagos pajar palos panes papas parar pares pasan pasas pasos patas patos pavos pecas peces pedal
pelos penas peras perra pesas pesos pibes picos pide piden pides pilas pinos pipas pisos pistola plata plena pocas
pocos podía polvo pomos ponen pones porra porta posar pozos puede puedo pulpa pumas puños puros puso
quedo queda quién quien quiso quizá
ramas ramos ranas raras raros ratas rayos reyes rezos rimas risas ritos robar robos rocas rojas rojos ropas rosas
rotas rotos rubia rutas
saben sabes sabía sacos salen sales salgo salió salta salvo sapos sarna secta sedas según sepas serán sería sexos
siete sigue sitúa sobra solas solos somos sopas sordo sorda sumas suyas suyos
tacos tazas temas tendrá tenga tengo tenía tiene tinto tiran tiras tíos tocan tomas toman tonta tonto torta trago
trajo tramo tumba tuyas tuyos
unas unos usaba usado usan usted
vacas valen vamos vasos veces velas vemos venas vengo venía veras verás vicio viene vimos vinos viuda viudo vivas
viven vives vivía votos
yacer
zorra zumos
`;


/** Más palabras válidas para probar, menos frecuentes. */
const EXTRA_MORE_RAW = `
agave albur alcoba arcón ardid argón arpía asceta astil atole balda banjo bayas bollo borla bozal brete brida broca
bulla burda burdo calza cáliz canje cañas capón caqui cargo carné casta catar cauto cazón cebar cejar cieno cirro clero
cobro cofia colza comba coste credo cubil cuita curia dalia dogma dotar ejido elfos envés épico estío etnia euros fajín
falaz farsa fasto fauno feudo fiado fisco flema flete flúor forro friso glosa grial guano hampa harén hedor hiato hidra
higos hoces horda hosco humus hurón jaleo jamba jibia jondo kilos kiwis labia lacra lagar laico lauro legar lerdo levar
libar lidia linde liras litio logia majar malta mesón milpa minar mitra mojón mosto mugir mugre nadir necio nimbo nopal
noria obeso ojiva orear orujo otear ovino pacer paila paria parir pasmo patán pavor peaje pecar penar peñón perol pifia
pillo pique pitar plebe porte potra prior prole pugna purga quema quina rabel ralea rauda raudo redil regio rehén renal
reojo reuma rifle rímel rotar rotor rublo rueca sable sacro sagaz salmo salve sarro sedal segar senil señas setas sidra
sifón silbo soler sopor sorna subte tacha tahúr talar talud tapia tarot tasca tasar tedio tibia tieso tifón timar tizón
tonel topar tordo torvo traba treta tripa turba ufano ujier ungir urdir usura vahos vatio vedar vello venal vetar vigas
viral visar visón vivaz volea yates yemas yendo yesca yesos yunta zafra zagal zarpa zumba
`;

/** Sustantivos de tres letras terminados en consonante: su plural (+es, z→ces) tiene cinco. */
const THREE_RAW = `bar bus col don fin gas gol haz hoz ley luz mal mar mes mil pan pez red rey sal ser sol son tez tos tul vez voz`;

/**
 * Verbos regulares, sin cambio de raíz. Se conjugan solos y se guardan las formas de cinco letras.
 * Los terminados en -car, -gar y -zar no generan las formas que cambian la consonante (busqué, pagué, cacé).
 */
const REGULAR_AR = `amar armar ayudar bailar bajar bañar besar borrar botar buscar cantar cazar cenar citar cobrar copiar
cortar crear cuidar curar dañar dejar domar donar dorar dudar durar echar entrar firmar ganar gastar girar gritar guardar
hablar hallar jalar juntar jurar lavar limar lijar llamar llegar llenar llevar luchar mandar mimar mirar mojar montar mudar
nadar narrar notar odiar optar orar pagar palpar parar pasar pegar peinar pelar pesar pescar picar pintar pisar portar
posar quemar quitar rayar remar retar rimar robar sacar saltar sanar secar sellar silbar soplar sudar sumar tapar tardar
tirar tocar tomar tratar trotar untar usar velar viajar votar`;
const REGULAR_ER = `barrer beber ceder comer correr coser deber lamer meter romper sorber tejer temer toser vender`;
const REGULAR_IR = `abrir batir cubrir latir partir pulir subir sufrir unir urdir vivir`;

const AR_ENDINGS = "o as a amos an é aste ó aron aba abas aban aré arás ará arán e es emos en ando ado ada ados adas".split(" ");
const ER_ENDINGS = "o es e emos en í iste ió imos ía ías ían eré erás erá erán a as amos an iendo ido ida idos idas".split(" ");
const IR_ENDINGS = "o es e imos en í iste ió ía ías ían iré irás irá irán a as amos an iendo ido ida idos idas".split(" ");

function conjugate(infinitive: string, endings: string[]): string[] {
  const stem = infinitive.slice(0, -2);
  const out = [infinitive];
  for (const ending of endings) {
    const soft = /^[eé]/.test(ending) && infinitive.endsWith("ar");
    if (soft && /[cgz]$/.test(stem)) continue;
    out.push(stem + ending);
  }
  return out;
}

const words = (raw: string) => raw.split(/\s+/).filter(Boolean);

export interface Dictionary {
  /** Respuestas posibles, normalizadas, sin repetir y en orden alfabético. */
  answers: readonly string[];
  /** Todas las palabras que se pueden probar (incluye las respuestas), normalizadas. */
  allowed: ReadonlySet<string>;
  /** Forma con tildes de cada respuesta, para mostrarla al final. */
  display: ReadonlyMap<string, string>;
}

let cached: Dictionary | null = null;

export function loadDictionary(): Dictionary {
  if (cached) return cached;
  const display = new Map<string, string>();
  for (const word of words(ANSWERS_RAW)) {
    const key = normalizeWord(word);
    if (isPlayableWord(key) && !display.has(key)) display.set(key, word.toLowerCase());
  }
  const answers = [...display.keys()].sort();
  const allowed = new Set<string>(answers);
  const add = (word: string) => {
    const key = normalizeWord(word);
    if (isPlayableWord(key)) allowed.add(key);
  };
  for (const word of words(FOUR_RAW)) add(word + "s");
  for (const word of words(FEMININE_RAW)) add(word.slice(0, -1) + "a");
  for (const word of words(EXTRA_RAW)) add(word);
  for (const word of words(EXTRA_MORE_RAW)) add(word);
  for (const word of words(THREE_RAW)) add(word.replace(/z$/, "c") + "es");
  for (const verb of words(REGULAR_AR)) conjugate(verb, AR_ENDINGS).forEach(add);
  for (const verb of words(REGULAR_ER)) conjugate(verb, ER_ENDINGS).forEach(add);
  for (const verb of words(REGULAR_IR)) conjugate(verb, IR_ENDINGS).forEach(add);
  cached = { answers, allowed, display };
  return cached;
}

/** Para auditar las listas: palabras escritas que no tienen cinco letras. */
export function malformedWords(): string[] {
  const bad: string[] = [];
  for (const word of words(ANSWERS_RAW)) if (!isPlayableWord(normalizeWord(word))) bad.push(word);
  for (const word of words(FEMININE_RAW)) if (!isPlayableWord(normalizeWord(word))) bad.push(word);
  return bad;
}
