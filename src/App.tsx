import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type Screen = "today" | "calendar" | "sheets" | "scale";
type SheetTab = "musculacao" | "abs";
type Sex = "Feminino" | "Masculino";
type ActivityFactor = "1.2" | "1.375" | "1.55" | "1.725";
type WorkoutKey = "A" | "B" | "C" | "D" | "Off" | "";
type AbsKey = "ABS1" | "ABS2" | "ABS3" | "";
type TimerPhase = "ready" | "prep" | "exercise" | "rest" | "done";

type DayRecord = {
  treino: WorkoutKey;
  abs: AbsKey;
  weight: string;
  notes: string;
};

type NutritionRecord = {
  kcal: string;
  prot: string;
};

type Profile = {
  sexo: Sex;
  idade: string;
  altura: string;
  peso: string;
  cintura: string;
  pescoco: string;
  quadril: string;
  atividade: ActivityFactor;
};

type Goals = {
  kcal: string;
  prot: string;
};

type Exercise = {
  name: string;
  summary: string;
  howTo: string[];
};

type TimerState = {
  phase: TimerPhase;
  secondsLeft: number;
  currentIndex: number;
  paused: boolean;
};

const TODAY = new Date();

const muscleLabels: Record<Exclude<WorkoutKey, "">, string> = {
  A: "Peito + Ombro + Tríceps",
  B: "Costas + Bíceps",
  C: "Pernas + Glúteos",
  D: "Full body leve",
  Off: "Descanso",
};

const absLabels: Record<Exclude<AbsKey, "">, string> = {
  ABS1: "Básico",
  ABS2: "Oblíquos",
  ABS3: "Intenso",
};

const musculacaoExercises: Record<Exclude<WorkoutKey, "" | "Off">, Exercise[]> = {
  A: [
    {
      name: "Supino reto com halteres",
      summary: "Movimento base para peitoral, com foco em estabilidade dos ombros e controle na descida.",
      howTo: [
        "Deite no banco com os pés firmes no chão, escápulas levemente encaixadas e halteres alinhados ao peito. Mantenha punhos neutros e cotovelos em trajetória confortável.",
        "Empurre os halteres para cima sem perder o alinhamento do tronco, expirando durante a subida. Desça devagar até sentir alongamento do peitoral, sem relaxar no fundo do movimento.",
        "Evite jogar os halteres para dentro ou abrir demais os cotovelos. Pense em aproximar os braços usando o peito, sem sobrecarregar a articulação do ombro.",
      ],
    },
    {
      name: "Supino inclinado com halteres",
      summary: "Variação que destaca a parte superior do peitoral e exige bom posicionamento de ombros.",
      howTo: [
        "Ajuste o banco em inclinação moderada. Posicione os halteres ao lado do peito alto, com tórax aberto e ombros para trás.",
        "Suba os halteres em arco natural, sem encostar com força no topo. Na descida, mantenha ritmo controlado e amplitude sem dor.",
        "Se sentir o ombro dominando demais, reduza carga e reforce a estabilidade das escápulas. O esforço principal deve ser no peitoral alto.",
      ],
    },
    {
      name: "Crucifixo máquina ou cabo",
      summary: "Exercício de isolamento para o peitoral, útil para conexão mente-músculo e controle de amplitude.",
      howTo: [
        "Ajuste a máquina ou os cabos para que as mãos iniciem abertas, com leve flexão nos cotovelos. O peito deve permanecer alto e estável.",
        "Traga os braços para frente como se abraçasse o centro do corpo, expirando no fechamento. Retorne lentamente, mantendo tensão contínua.",
        "Não transforme o movimento em supino. O braço deve manter formato semelhante do início ao fim, sem dobrar excessivamente o cotovelo.",
      ],
    },
    {
      name: "Desenvolvimento sentado com halteres",
      summary: "Principal exercício de ombros da ficha A, com ênfase em deltóide anterior e estabilidade.",
      howTo: [
        "Sente-se com coluna apoiada, abdômen firme e halteres na altura dos ombros. Os antebraços começam quase verticais.",
        "Empurre os halteres acima da cabeça de forma controlada, sem arquear demais a lombar. Desça até a linha dos ombros ou pouco abaixo, mantendo o controle.",
        "Se a lombar compensar, reduza a carga e tensione melhor o core. O pescoço deve ficar relaxado, sem encolher os ombros.",
      ],
    },
    {
      name: "Elevação lateral",
      summary: "Isolamento clássico para deltóide lateral, importante para largura visual dos ombros.",
      howTo: [
        "Fique em pé com joelhos levemente flexionados e halteres ao lado do corpo. Mantenha tronco estável e cotovelos suavemente dobrados.",
        "Eleve os braços até perto da linha dos ombros, guiando com os cotovelos. Desça devagar, sem deixar os pesos despencarem.",
        "Evite balançar o tronco ou subir demais. O objetivo é sentir o ombro lateral trabalhando, não gerar impulso com o corpo.",
      ],
    },
    {
      name: "Tríceps na polia com barra",
      summary: "Exercício estável para tríceps, bom para controlar repetição e contração final.",
      howTo: [
        "Fique em frente à polia com cotovelos perto do tronco e peito aberto. Segure a barra sem tensionar excessivamente os punhos.",
        "Empurre a barra para baixo até estender os cotovelos, expirando no final. Retorne devagar até aproximadamente 90 graus ou um pouco mais.",
        "Não deixe os cotovelos abrirem demais. O movimento deve acontecer principalmente na articulação do cotovelo.",
      ],
    },
    {
      name: "Tríceps francês com halter",
      summary: "Alongamento forte para a porção longa do tríceps, exigindo atenção ao cotovelo.",
      howTo: [
        "Segure um halter com as duas mãos acima da cabeça, mantendo cotovelos apontados para frente. Ative o abdômen para não arquear a coluna.",
        "Flexione os cotovelos levando o halter atrás da cabeça com controle e depois estenda até voltar ao topo.",
        "Se os cotovelos abrirem demais ou surgir desconforto, reduza a carga. Priorize amplitude segura e tensão contínua no tríceps.",
      ],
    },
  ],
  B: [
    {
      name: "Puxada frontal na polia",
      summary: "Movimento base para dorsais, com foco em depressão das escápulas e cotovelos puxando para baixo.",
      howTo: [
        "Sente-se firme, segure a barra com pegada confortável e mantenha o peito levemente elevado. Antes de puxar, organize as escápulas.",
        "Traga a barra em direção à parte alta do peito, pensando em conduzir o movimento com os cotovelos. Retorne lentamente até alongar as costas.",
        "Evite jogar o tronco para trás e puxar apenas com os braços. O objetivo é sentir dorsais e região média das costas trabalhando juntas.",
      ],
    },
    {
      name: "Remada baixa na polia",
      summary: "Exercício para densidade de costas, útil para postura e controle escapular.",
      howTo: [
        "Sente-se com coluna neutra, peito aberto e joelhos levemente flexionados. Segure o triângulo ou barra com ombros longe das orelhas.",
        "Puxe em direção ao abdômen ou à linha da cintura, aproximando escápulas no final. Volte devagar sem perder o alinhamento do tronco.",
        "Não compense com impulso ou balanço. Use ritmo constante para reforçar a conexão com dorsais e rombóides.",
      ],
    },
    {
      name: "Remada unilateral com halter",
      summary: "Excelente para corrigir desequilíbrios e dar atenção a cada lado das costas.",
      howTo: [
        "Apoie uma mão e um joelho no banco, deixando a coluna neutra. O braço que trabalha começa estendido, com ombro encaixado.",
        "Puxe o halter em direção ao quadril, mantendo o cotovelo próximo ao corpo. Desça com controle até alongar as costas.",
        "Evite girar o tronco para roubar a repetição. O foco é no trajeto do cotovelo e na contração das costas, não na carga bruta.",
      ],
    },
    {
      name: "Pulldown com braços estendidos",
      summary: "Movimento complementar para dorsais, reforçando a extensão do ombro sem sobrecarregar bíceps.",
      howTo: [
        "Fique em pé diante da polia alta com leve inclinação do tronco. Segure a barra ou corda com braços quase estendidos.",
        "Empurre a barra para baixo até a linha das coxas usando as costas, mantendo cotovelos só levemente flexionados. Retorne devagar.",
        "Não faça o exercício como uma remada. Pense em levar os braços para baixo com as dorsais, mantendo o tronco estável.",
      ],
    },
    {
      name: "Rosca direta com barra",
      summary: "Base para bíceps, priorizando técnica limpa e controle na descida.",
      howTo: [
        "Fique em pé com pés estáveis, cotovelos junto ao tronco e barra na frente das coxas. Mantenha punhos alinhados.",
        "Flexione os cotovelos levando a barra para cima sem jogar o corpo para trás. Desça lentamente para aproveitar o trabalho excêntrico.",
        "Evite balanço excessivo. Se precisar roubar muito, a carga está acima do ideal para a execução proposta.",
      ],
    },
    {
      name: "Rosca alternada com halteres",
      summary: "Permite foco unilateral e ajuste natural da pegada durante a subida.",
      howTo: [
        "Segure os halteres ao lado do corpo com ombros relaxados. Suba um braço por vez, girando a palma para cima se desejar maior supinação.",
        "Expire na subida e desça com controle, alternando os lados sem pressa. O tronco deve permanecer estável.",
        "Não suba o cotovelo para frente exageradamente. O bíceps deve trabalhar com amplitude confortável e sem impulso desnecessário.",
      ],
    },
    {
      name: "Rosca martelo",
      summary: "Variação que recruta braquial e antebraço, ajudando no volume do braço como um todo.",
      howTo: [
        "Comece com halteres em pegada neutra, palmas voltadas uma para a outra. Mantenha cotovelos próximos ao corpo.",
        "Eleve os halteres sem girar a pegada e desça de forma lenta. Concentre-se em manter o punho neutro e a execução limpa.",
        "É comum tentar acelerar a subida. Prefira um ritmo estável para aumentar a tensão muscular de verdade.",
      ],
    },
  ],
  C: [
    {
      name: "Cadeira abdutora",
      summary: "Ativa glúteo médio e musculatura lateral do quadril, importante para estabilidade pélvica.",
      howTo: [
        "Sente-se com lombar apoiada e pernas alinhadas no equipamento. Ajuste amplitude para não forçar o quadril logo no início.",
        "Afaste as pernas contra a resistência, expirando na abertura. Retorne devagar sem perder a tensão.",
        "Evite movimentos bruscos e foco apenas na carga. Busque sentir a lateral do glúteo contraindo durante todo o arco.",
      ],
    },
    {
      name: "Agachamento goblet ou livre",
      summary: "Padrão global de pernas, com ênfase em quadríceps e glúteos quando bem executado.",
      howTo: [
        "Posicione os pés em largura confortável, abdômen firme e peito aberto. Desça flexionando joelhos e quadris ao mesmo tempo.",
        "Mantenha o peso distribuído no pé inteiro e suba empurrando o chão. Expire durante a subida e mantenha a coluna neutra.",
        "Se os joelhos colapsarem para dentro, reduza a carga e reforce o controle. A profundidade deve respeitar mobilidade e conforto articular.",
      ],
    },
    {
      name: "Cadeira extensora",
      summary: "Isolamento para quadríceps, útil para reforço de joelho com técnica cuidadosa.",
      howTo: [
        "Ajuste o banco para que o eixo da máquina fique alinhado ao joelho. Sente-se com quadris bem encaixados.",
        "Estenda os joelhos até a faixa confortável e contraia o quadríceps no topo sem travar de forma agressiva. Desça lentamente.",
        "Não use impulso. Em caso de sensibilidade no joelho, reduza amplitude ou carga e priorize execução suave.",
      ],
    },
    {
      name: "Mesa flexora",
      summary: "Trabalha posteriores de coxa com foco em controle e encurtamento muscular.",
      howTo: [
        "Ajuste a máquina para que o rolo fique acima dos calcanhares e o quadril esteja estável. Ative o abdômen e mantenha o tronco relaxado.",
        "Flexione os joelhos puxando o rolo em direção aos glúteos. Segure brevemente a contração e retorne de forma lenta.",
        "Evite tirar o quadril do apoio para terminar a repetição. O posterior deve assumir o esforço principal.",
      ],
    },
    {
      name: "Stiff com halteres",
      summary: "Exercício dominante de quadril para glúteos e posteriores, exigindo boa consciência corporal.",
      howTo: [
        "Fique em pé com halteres na frente das coxas, joelhos levemente flexionados e coluna neutra. Inicie o movimento empurrando o quadril para trás.",
        "Desça os halteres perto das pernas até sentir alongamento dos posteriores sem perder a lombar neutra. Suba contraindo glúteos e trazendo o quadril à frente.",
        "Não transforme o exercício em agachamento. O objetivo é dobrar no quadril, não nos joelhos.",
      ],
    },
    {
      name: "Hip thrust",
      summary: "Movimento forte para glúteos, excelente para contração máxima na extensão do quadril.",
      howTo: [
        "Apoie a parte alta das costas no banco, pés firmes e barra ou carga sobre o quadril. O queixo pode ficar levemente recolhido.",
        "Eleve o quadril até formar linha entre ombros, quadris e joelhos, contraindo glúteos no topo. Desça com controle sem relaxar totalmente.",
        "Evite jogar a lombar para trás no final. Pense em fechar o glúteo, não em hiperestender a coluna.",
      ],
    },
    {
      name: "Cadeira adutora",
      summary: "Complementa o trabalho interno de coxa e auxilia no controle de quadril.",
      howTo: [
        "Sente-se com apoio lombar e pernas posicionadas no equipamento. Ajuste a amplitude conforme conforto.",
        "Aproxime as pernas contra a resistência e retorne lentamente, mantendo o movimento suave.",
        "Não bata as cargas no final do retorno. O exercício funciona melhor com tensão contínua e postura estável.",
      ],
    },
    {
      name: "Panturrilha em pé ou sentado",
      summary: "Treino de panturrilhas com atenção ao alongamento completo e à pausa na contração.",
      howTo: [
        "Posicione a ponta dos pés firme na base e permita leve alongamento do calcanhar no final da descida. O tronco deve ficar estável.",
        "Suba até o ponto máximo controlado, contraindo a panturrilha no topo. Desça devagar para aproveitar a amplitude.",
        "Evite quicar e fazer repetições curtas demais. A panturrilha responde bem a ritmo controlado e boa amplitude.",
      ],
    },
  ],
  D: [
    {
      name: "Supino leve ou flexão inclinada",
      summary: "Empurrar horizontal com carga moderada para manter padrão técnico sem exaustão excessiva.",
      howTo: [
        "Escolha uma variação confortável. Mantenha tronco firme, ombros organizados e movimento sem pressa.",
        "Empurre controlando a fase de subida e desça em ritmo constante, mantendo alinhamento dos cotovelos.",
        "A ideia do treino D é circular o corpo e manter estímulo, não chegar ao limite absoluto.",
      ],
    },
    {
      name: "Combo ombro 3 direções",
      summary: "Sequência leve para deltóides em diferentes ângulos, reforçando coordenação e resistência.",
      howTo: [
        "Use halteres leves. Alterne elevação frontal, lateral e em plano escapular com postura estável.",
        "Mantenha o abdômen ativo e suba apenas até a faixa confortável dos ombros. Controle bem a descida.",
        "Se perder técnica, reduza peso. O combo funciona melhor com fluidez e amplitude segura.",
      ],
    },
    {
      name: "Remada leve com cabo ou halter",
      summary: "Puxar horizontal para equilibrar a cadeia superior sem exigir volume alto.",
      howTo: [
        "Organize a coluna neutra e o peito aberto. Puxe levando o cotovelo para trás com ombros longe das orelhas.",
        "Segure um instante no final e retorne com controle, sem perder a posição do tronco.",
        "Priorize sensação nas costas e estabilidade geral. O treino D deve sair revigorante, não drenante.",
      ],
    },
    {
      name: "Avanço alternado",
      summary: "Padrão unilateral para pernas e glúteos com boa demanda de equilíbrio.",
      howTo: [
        "Dê um passo à frente ou para trás e desça até uma faixa segura para joelhos e quadris. Mantenha o tronco organizado.",
        "Empurre o chão para retornar e alterne o lado. Use apoio se precisar estabilizar melhor.",
        "Não force amplitude se houver desconforto. O foco é controle, coordenação e trabalho limpo das pernas.",
      ],
    },
    {
      name: "Panturrilha com variação de apoio",
      summary: "Trabalho leve de panturrilha mudando apoio para estimular estabilidade e mobilidade.",
      howTo: [
        "Pode ser em pé, unilateral com apoio ou em máquina leve. Mantenha o tornozelo alinhado e o pé firme.",
        "Suba com controle, faça breve pausa e desça devagar até alongar. Repita sem pressa.",
        "Evite compensar jogando o corpo. O tornozelo deve se mover com precisão.",
      ],
    },
    {
      name: "Core leve com dead bug ou prancha curta",
      summary: "Fechamento do treino com ativação de core e estabilidade lombar.",
      howTo: [
        "Escolha uma variação simples e tecnicamente boa. Respire fundo, encaixe as costelas e estabilize a lombar.",
        "Execute poucas repetições muito bem feitas ou blocos curtos de prancha, sem tremer por perda completa de forma.",
        "O objetivo é sair do treino sentindo o centro do corpo ativo, não exaurido.",
      ],
    },
  ],
};

const absExercises: Record<Exclude<AbsKey, "">, Exercise[]> = {
  ABS1: [
    {
      name: "Dead bug controlado",
      summary: "Ativação de core com foco em estabilidade lombar e coordenação cruzada.",
      howTo: [
        "Deite com lombar neutra próxima do chão, braços para cima e quadris/joelhos em 90 graus.",
        "Estenda braço e perna opostos sem perder o abdômen firme. Volte e alterne os lados em ritmo controlado.",
        "Se a lombar arquear, encurte a amplitude. Qualidade é mais importante que velocidade.",
      ],
    },
    {
      name: "Prancha alta",
      summary: "Base de estabilidade anterior, exigindo alinhamento de ombros, tronco e quadris.",
      howTo: [
        "Apoie as mãos abaixo dos ombros e estenda as pernas. Mantenha glúteos e abdômen ativos.",
        "Empurre o chão, alongue a nuca e evite deixar o quadril cair ou subir demais.",
        "Respire curto e controlado. A prancha é uma posição ativa, não apenas uma parada.",
      ],
    },
    {
      name: "Crunch curto",
      summary: "Flexão de tronco simples para enfatizar reto abdominal sem puxar o pescoço.",
      howTo: [
        "Deite com joelhos flexionados e mãos apoiadas levemente ao lado da cabeça ou cruzadas no peito.",
        "Eleve a parte alta das escápulas do chão aproximando costelas da pelve. Retorne devagar sem relaxar totalmente.",
        "Não puxe a cabeça com as mãos. Pense em enrolar o tronco usando o abdômen.",
      ],
    },
    {
      name: "Elevação de joelhos deitada",
      summary: "Movimento básico para porção inferior do abdômen com boa segurança.",
      howTo: [
        "Deite com mãos ao lado do corpo ou sob o quadril para maior apoio. Eleve os joelhos em direção ao peito.",
        "Desça controlando, sem deixar a lombar perder completamente o apoio. O movimento deve ser suave.",
        "Se sentir mais o quadril do que o abdômen, reduza amplitude e desacelere a descida.",
      ],
    },
    {
      name: "Prancha com toque no ombro",
      summary: "Prancha dinâmica que desafia anti-rotação do core.",
      howTo: [
        "Entre em prancha alta com pés um pouco mais afastados para estabilidade. Toque um ombro com a mão oposta, alternando.",
        "O quadril deve balançar o mínimo possível. Controle a transferência de peso entre os braços.",
        "Faça o movimento devagar para manter a qualidade da anti-rotação.",
      ],
    },
    {
      name: "Bicicleta lenta",
      summary: "Combina flexão de tronco e rotação suave para ativar toda a parede abdominal.",
      howTo: [
        "Deite, tire as escápulas do chão e aproxime cotovelo e joelho opostos alternadamente.",
        "Mantenha a perna que estende ativa, mas sem jogar a lombar para fora do chão.",
        "Evite pedalar rápido demais. A versão lenta gera mais controle e menos compensação.",
      ],
    },
    {
      name: "Prancha de antebraço",
      summary: "Variação clássica para resistência do core com menor carga nos punhos.",
      howTo: [
        "Apoie antebraços no chão com cotovelos abaixo dos ombros. Estenda as pernas e alinhe o corpo.",
        "Ative glúteos, coxas e abdômen. Respire sem deixar a lombar afundar.",
        "Se perder alinhamento, encurte o tempo ou eleve a posição em apoio mais fácil.",
      ],
    },
    {
      name: "Toe taps",
      summary: "Exercício simples de coordenação e estabilidade com pernas em 90 graus.",
      howTo: [
        "Deite com joelhos e quadris em 90 graus. Toque um pé no chão por vez sem perder o tronco firme.",
        "A lombar deve continuar estável. Alterne lados com respiração controlada.",
        "Quanto mais lento, maior a exigência do core.",
      ],
    },
    {
      name: "Crunch com pausa no topo",
      summary: "Versão do crunch com ênfase em contração máxima.",
      howTo: [
        "Suba como no crunch normal e segure um instante no ponto de maior contração.",
        "Desça devagar, mantendo o abdômen ativo durante a volta.",
        "A pausa curta ajuda a evitar repetição automática e melhora a percepção muscular.",
      ],
    },
    {
      name: "Hollow tuck hold",
      summary: "Isometria básica de core para fechar a sequência com controle.",
      howTo: [
        "Deite e eleve levemente ombros e pernas, mantendo joelhos mais recolhidos para versão básica.",
        "Encaixe costelas e segure a posição respirando curto e firme.",
        "Se a lombar descolar do chão, simplifique a posição trazendo mais os joelhos.",
      ],
    },
  ],
  ABS2: [
    {
      name: "Prancha lateral direita",
      summary: "Ativação de oblíquos e quadril lateral do lado direito.",
      howTo: [
        "Apoie antebraço direito no chão, cotovelo abaixo do ombro e pernas alinhadas.",
        "Eleve o quadril mantendo corpo em linha reta. O pescoço deve ficar neutro.",
        "Se necessário, apoie o joelho de baixo para facilitar sem perder o foco nos oblíquos.",
      ],
    },
    {
      name: "Prancha lateral esquerda",
      summary: "Mesma lógica da prancha lateral, agora para o lado esquerdo.",
      howTo: [
        "Apoie o antebraço esquerdo e organize o corpo em linha reta.",
        "Mantenha o quadril elevado e o abdômen firme durante todo o bloco.",
        "Controle a respiração para não travar o pescoço nem compensar com o ombro.",
      ],
    },
    {
      name: "Russian twist controlado",
      summary: "Rotação de tronco com ênfase em oblíquos, feita sem pressa.",
      howTo: [
        "Sente-se com tronco levemente inclinado e pés apoiados ou elevados, conforme nível.",
        "Gire o tronco para um lado e para o outro mantendo a coluna longa.",
        "A rotação deve vir do tronco, não só dos braços balançando para os lados.",
      ],
    },
    {
      name: "Mountain climber cruzado",
      summary: "Movimento dinâmico com estímulo cardiovascular leve e rotação controlada.",
      howTo: [
        "Em prancha alta, leve o joelho em direção ao cotovelo oposto alternadamente.",
        "Mantenha mãos estáveis e quadril controlado enquanto alterna os lados.",
        "Não acelere ao ponto de perder o padrão. O cruzamento deve ser limpo.",
      ],
    },
    {
      name: "Heel touches",
      summary: "Flexão lateral curta para sentir oblíquos próximos à cintura.",
      howTo: [
        "Deite com joelhos flexionados e tronco levemente elevado. Alcance um calcanhar de cada vez com a mão do mesmo lado.",
        "Faça o movimento curto e contínuo, mantendo tensão na lateral do abdômen.",
        "Evite jogar a cabeça para frente. Pense em encurtar as costelas de um lado por vez.",
      ],
    },
    {
      name: "Prancha alta com rotação",
      summary: "Desafia anti-rotação e mobilidade torácica ao mesmo tempo.",
      howTo: [
        "Em prancha alta, eleve um braço girando o tronco para abrir o peito lateralmente.",
        "Volte ao centro com controle e alterne os lados.",
        "O quadril deve girar junto sem perder o domínio do corpo inteiro.",
      ],
    },
    {
      name: "Side crunch direito",
      summary: "Contração lateral com foco no lado direito.",
      howTo: [
        "Deite de lado ou mantenha posição de oblíquo em solo. Aproxime costelas e quadril do lado direito.",
        "Faça repetições curtas, sentindo a lateral encurtar.",
        "Evite movimento de pescoço; concentre-se no abdômen lateral.",
      ],
    },
    {
      name: "Side crunch esquerdo",
      summary: "Mesma lógica do side crunch para o lado esquerdo.",
      howTo: [
        "Monte a posição confortável e repita a flexão lateral do tronco para o lado esquerdo.",
        "Mantenha ritmo constante e controle total da amplitude.",
        "Se perder a sensação no oblíquo, diminua a velocidade.",
      ],
    },
    {
      name: "Prancha lateral com toque no quadril",
      summary: "Variação lateral com pequena amplitude dinâmica.",
      howTo: [
        "Entre na prancha lateral e faça uma pequena descida e subida do quadril com controle.",
        "Mantenha o ombro firme e o movimento vindo dos oblíquos e quadril lateral.",
        "A amplitude pode ser curta; a estabilidade vale mais que a velocidade.",
      ],
    },
    {
      name: "Torção em pé com core ativo",
      summary: "Fechamento da sequência em posição vertical, reforçando rotação controlada.",
      howTo: [
        "Fique em pé com joelhos soltos e mãos à frente do peito. Gire o tronco de um lado para o outro com controle.",
        "Mantenha o abdômen ativo para frear a volta, não apenas para iniciar o giro.",
        "O movimento pode ser leve, mas deve ser consciente e sem soltar a lombar.",
      ],
    },
  ],
  ABS3: [
    {
      name: "Prancha com arraste imaginário",
      summary: "Prancha forte com ênfase em anti-rotação e tensão total do corpo.",
      howTo: [
        "Em prancha alta, simule arrastar o chão para trás com as mãos sem realmente mover o corpo.",
        "Ative glúteos, abdômen e coxas como se estivesse comprimindo o corpo inteiro.",
        "A intensidade vem da tensão interna, não de movimentos rápidos.",
      ],
    },
    {
      name: "Hollow hold",
      summary: "Isometria intensa de core anterior, muito eficiente para resistência abdominal.",
      howTo: [
        "Deite e eleve ombros e pernas mantendo a lombar pressionada no chão.",
        "Braços podem ficar ao lado do corpo ou acima da cabeça para aumentar dificuldade.",
        "Se a lombar sair do chão, recue para uma versão mais fechada.",
      ],
    },
    {
      name: "Leg raise controlado",
      summary: "Elevação de pernas com controle da lombar e foco em abdômen inferior.",
      howTo: [
        "Deite com pernas estendidas e mãos sob o quadril se precisar de suporte.",
        "Suba e desça as pernas de forma lenta, sem deixar a lombar perder estabilidade.",
        "Amplitude menor com controle vale mais do que amplitude total com compensação.",
      ],
    },
    {
      name: "V-sit alternado",
      summary: "Combina flexão de tronco e elevação de pernas de forma exigente.",
      howTo: [
        "Parta de posição semi-reclinada e aproxime tronco e pernas, alternando o alcance das mãos se desejar.",
        "Mantenha o peito aberto e o abdômen comandando a subida.",
        "Não trave a respiração. O movimento deve ser intenso, mas ainda controlado.",
      ],
    },
    {
      name: "Plank walk",
      summary: "Transição entre antebraço e mãos, exigindo estabilidade e resistência.",
      howTo: [
        "Comece em prancha alta ou baixa e alterne a subida e a descida dos apoios, um braço de cada vez.",
        "Tente manter o quadril o mais estável possível durante as transições.",
        "Se o corpo balançar demais, diminua o ritmo até recuperar o controle.",
      ],
    },
    {
      name: "Toe reach",
      summary: "Flexão concentrada de tronco para acentuar reto abdominal em amplitude curta.",
      howTo: [
        "Deite com pernas elevadas ou dobradas e alcance os pés ou tornozelos com as mãos.",
        "Suba enrolando a parte alta do tronco e desça de forma lenta.",
        "Evite puxar o pescoço; pense em aproximar costelas da pelve.",
      ],
    },
    {
      name: "Prancha serrando à frente",
      summary: "Prancha de antebraço com pequeno deslocamento do corpo, aumentando alavanca.",
      howTo: [
        "Na prancha de antebraço, empurre o corpo levemente para frente e volte, mantendo o corpo em bloco.",
        "O movimento deve ser curto e consciente, com ombros e core travando a posição.",
        "Não deixe a lombar cair na ida nem na volta.",
      ],
    },
    {
      name: "Reverse crunch",
      summary: "Elevação da pelve com foco em enrolar a parte inferior do tronco.",
      howTo: [
        "Deite com joelhos dobrados e eleve a pelve do chão em movimento curto e controlado.",
        "Volte vértebra por vértebra, sem jogar as pernas para ganhar impulso.",
        "A intenção é enrolar o quadril para dentro, não apenas balançar as pernas.",
      ],
    },
    {
      name: "Dead bug estendido",
      summary: "Versão mais longa do dead bug para reforçar estabilidade em amplitude maior.",
      howTo: [
        "Faça o padrão cruzado, mas leve braço e perna a uma extensão maior sem perder a lombar estável.",
        "Respire ao estender e volte de forma controlada ao centro.",
        "Se a técnica quebrar, reduza a amplitude imediatamente.",
      ],
    },
    {
      name: "Prancha final total body",
      summary: "Encerramento intenso com foco em resistência do core e postura global.",
      howTo: [
        "Assuma a prancha mais desafiadora que consiga manter com forma correta, alta ou antebraço.",
        "Ative tudo: mãos/antebraços, ombros, abdômen, glúteos e pernas. Respire curto e firme.",
        "A sequência termina com qualidade. Se necessário, reduza o nível para sustentar o alinhamento.",
      ],
    },
  ],
};

const emptyDayRecord = (): DayRecord => ({ treino: "", abs: "", weight: "", notes: "" });
const emptyNutritionRecord = (): NutritionRecord => ({ kcal: "", prot: "" });
const defaultProfile = (): Profile => ({
  sexo: "Feminino",
  idade: "",
  altura: "",
  peso: "",
  cintura: "",
  pescoco: "",
  quadril: "",
  atividade: "1.55",
});
const defaultGoals = (): Goals => ({ kcal: "", prot: "" });
const defaultTimer = (): TimerState => ({ phase: "ready", secondsLeft: 45, currentIndex: 0, paused: false });

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatLongDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  const weekday = capitalize(new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date));
  const dayMonth = capitalize(
    new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(date)
  );
  return { weekday, dayMonth };
}

function getWeekdayShort(date: Date) {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
      .format(date)
      .replace(".", "")
      .slice(0, 3)
  );
}

function getStorageKey(dateKey: string) {
  return `diariotreino-dia-${dateKey}`;
}

function getNutritionStorageKey(dateKey: string) {
  return `diariotreino-nutri-${dateKey}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return { ...fallback, ...JSON.parse(value) };
  } catch {
    return fallback;
  }
}

function hasDayContent(record?: Partial<DayRecord> | null) {
  if (!record) return false;
  return Boolean(record.treino || record.abs || record.weight || record.notes);
}

function loadAllDayRecords() {
  const map: Record<string, DayRecord> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("diariotreino-dia-")) {
      const dateKey = key.replace("diariotreino-dia-", "");
      map[dateKey] = safeParse<DayRecord>(localStorage.getItem(key), emptyDayRecord());
    }
  }
  return map;
}

function loadDayRecord(dateKey: string) {
  return safeParse<DayRecord>(localStorage.getItem(getStorageKey(dateKey)), emptyDayRecord());
}

function loadNutritionRecord(dateKey: string) {
  return safeParse<NutritionRecord>(localStorage.getItem(getNutritionStorageKey(dateKey)), emptyNutritionRecord());
}

function saveDayRecord(dateKey: string, value: DayRecord) {
  localStorage.setItem(getStorageKey(dateKey), JSON.stringify(value));
}

function saveNutritionRecord(dateKey: string, value: NutritionRecord) {
  localStorage.setItem(getNutritionStorageKey(dateKey), JSON.stringify(value));
}

function loadProfile() {
  return safeParse<Profile>(localStorage.getItem("diariotreino-perfil"), defaultProfile());
}

function saveProfile(value: Profile) {
  localStorage.setItem("diariotreino-perfil", JSON.stringify(value));
}

function loadGoals() {
  return safeParse<Goals>(localStorage.getItem("diariotreino-metas"), defaultGoals());
}

function saveGoals(value: Goals) {
  localStorage.setItem("diariotreino-metas", JSON.stringify(value));
}

function describeWorkout(value: WorkoutKey) {
  if (!value) return "—";
  return value === "Off" ? "Descanso" : `Treino ${value}`;
}

function describeAbs(value: AbsKey) {
  return value ? value : "—";
}

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getMonthName(date: Date) {
  return capitalize(new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date));
}

function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function getWeekDates(baseDateKey: string) {
  const start = getStartOfWeek(parseDateKey(baseDateKey));
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function getMonthGrid(reference: Date) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1, 12);
  const last = new Date(year, month + 1, 0, 12);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function calculateStreak(records: Record<string, DayRecord>) {
  let streak = 0;
  const cursor = new Date(TODAY);
  cursor.setHours(12, 0, 0, 0);

  while (true) {
    const key = formatDateKey(cursor);
    if (hasDayContent(records[key])) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ringGradient(progress: number, colors: [string, string]) {
  const value = Math.max(0, Math.min(100, progress));
  return {
    background: `conic-gradient(from 180deg, ${colors[0]} 0%, ${colors[1]} ${value}%, rgba(71,85,105,0.15) ${value}%, rgba(71,85,105,0.15) 100%)`,
  };
}

function getBmiInfo(bmi: number | null) {
  if (bmi === null || Number.isNaN(bmi)) {
    return {
      label: "Preencha perfil",
      tone: "text-sky-200",
      colors: ["#38bdf8", "#7dd3fc"] as [string, string],
      explanation: "Informe peso e altura para calcular.",
      progress: 12,
    };
  }
  if (bmi < 18.5) {
    return {
      label: "Abaixo do peso",
      tone: "text-sky-300",
      colors: ["#38bdf8", "#bae6fd"] as [string, string],
      explanation: "IMC abaixo da faixa de referência. Isso não substitui avaliação clínica.",
      progress: 24,
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal",
      tone: "text-emerald-300",
      colors: ["#22c55e", "#86efac"] as [string, string],
      explanation: "IMC dentro da faixa de referência.",
      progress: 52,
    };
  }
  if (bmi < 30) {
    return {
      label: "Sobrepeso",
      tone: "text-amber-300",
      colors: ["#eab308", "#fde68a"] as [string, string],
      explanation: "IMC acima da faixa de referência.",
      progress: 74,
    };
  }
  return {
    label: "Obesidade",
    tone: "text-orange-300",
    colors: ["#f97316", "#fdba74"] as [string, string],
    explanation: "IMC bem acima da faixa de referência.",
    progress: 92,
  };
}

function getBodyFatResult(profile: Profile) {
  const sexo = profile.sexo;
  const altura = toNumber(profile.altura);
  const cintura = toNumber(profile.cintura);
  const pescoco = toNumber(profile.pescoco);
  const quadril = toNumber(profile.quadril);

  if (!altura || !cintura || !pescoco || Number.isNaN(altura) || Number.isNaN(cintura) || Number.isNaN(pescoco)) {
    return null;
  }

  let result: number | null = null;
  if (sexo === "Masculino") {
    const base = cintura - pescoco;
    if (base <= 0) return null;
    result = 495 / (1.0324 - 0.19077 * Math.log10(base) + 0.15456 * Math.log10(altura)) - 450;
  } else {
    if (!quadril || Number.isNaN(quadril)) return null;
    const base = cintura + quadril - pescoco;
    if (base <= 0) return null;
    result = 495 / (1.29579 - 0.35004 * Math.log10(base) + 0.221 * Math.log10(altura)) - 450;
  }

  if (!Number.isFinite(result)) return null;
  return Math.max(0, result);
}

function getBodyFatInfo(value: number | null, sexo: Sex) {
  if (value === null) {
    return { label: "Preencha circunferências", explanation: "" };
  }

  if (sexo === "Masculino") {
    if (value < 6) return { label: "Muito baixo", explanation: "Requer atenção à recuperação." };
    if (value < 18) return { label: "Saudável", explanation: "Faixa compatível com boa composição." };
    if (value < 25) return { label: "Acima do ideal", explanation: "Ajustes de rotina podem ajudar." };
    return { label: "Alto", explanation: "Acompanhe com outras medidas." };
  }

  if (value < 14) return { label: "Muito baixo", explanation: "Atenção ao equilíbrio hormonal." };
  if (value < 25) return { label: "Saudável", explanation: "Faixa compatível com boa composição." };
  if (value < 32) return { label: "Acima do ideal", explanation: "Estratégia de treino e nutrição pode melhorar." };
  return { label: "Alto", explanation: "Use como estimativa de acompanhamento." };
}

function getTmb(profile: Profile) {
  const peso = toNumber(profile.peso);
  const altura = toNumber(profile.altura);
  const idade = toNumber(profile.idade);
  if ([peso, altura, idade].some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return profile.sexo === "Masculino"
    ? 10 * peso + 6.25 * altura - 5 * idade + 5
    : 10 * peso + 6.25 * altura - 5 * idade - 161;
}

function getTdee(profile: Profile) {
  const tmb = getTmb(profile);
  if (tmb === null) return null;
  return tmb * Number(profile.atividade);
}

function AppIcon({ type }: { type: Screen }) {
  return <span className={`nav-icon nav-icon-${type}`} aria-hidden="true" />;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-0.5">
      <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function MetricBox({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-1.5 font-mono text-xl font-bold tracking-tight text-white">{value}</p>
      {caption ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{caption}</p> : null}
    </div>
  );
}

function QuickActionButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
        active
          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(34,197,94,0.12)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {label}
    </button>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [sheetTab, setSheetTab] = useState<SheetTab>("musculacao");
  const [selectedWorkoutSheet, setSelectedWorkoutSheet] = useState<Exclude<WorkoutKey, "" | "Off">>("A");
  const [selectedAbsSheet, setSelectedAbsSheet] = useState<Exclude<AbsKey, "">>("ABS1");
  const [selectedWorkoutExercise, setSelectedWorkoutExercise] = useState(0);
  const [selectedAbsExercise, setSelectedAbsExercise] = useState(0);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(TODAY));
  const [currentMonth, setCurrentMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1, 12));
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [dayDraft, setDayDraft] = useState<DayRecord>(emptyDayRecord());
  const [nutritionDraft, setNutritionDraft] = useState<NutritionRecord>(emptyNutritionRecord());
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [goals, setGoals] = useState<Goals>(defaultGoals());
  const [showExport, setShowExport] = useState(false);
  const [exportContent, setExportContent] = useState("");
  const [timerSequence, setTimerSequence] = useState<Exclude<AbsKey, "">>("ABS1");
  const [timer, setTimer] = useState<TimerState>(defaultTimer());
  const [showCalendarDetail, setShowCalendarDetail] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousTickRef = useRef<string>("");
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRecords(loadAllDayRecords());
    setDayDraft(loadDayRecord(selectedDate));
    setNutritionDraft(loadNutritionRecord(selectedDate));
    setProfile(loadProfile());
    setGoals(loadGoals());
  }, []);

  useEffect(() => {
    setDayDraft(loadDayRecord(selectedDate));
    setNutritionDraft(loadNutritionRecord(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    previousTickRef.current = `${timer.phase}-${timer.secondsLeft}-${timer.currentIndex}-${timer.paused}`;
  }, []);

  // Timer logic - FIXED
  useEffect(() => {
    if (!["prep", "exercise", "rest"].includes(timer.phase) || timer.paused) return;

    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (current.paused) return current;
        if (current.secondsLeft > 1) {
          return { ...current, secondsLeft: current.secondsLeft - 1 };
        }

        const sequence = absExercises[timerSequence];

        if (current.phase === "prep") {
          return { ...current, phase: "exercise", secondsLeft: 45, currentIndex: 0 };
        }

        if (current.phase === "exercise") {
          if (current.currentIndex >= sequence.length - 1) {
            return { ...current, phase: "done", secondsLeft: 0, paused: false };
          }
          return { ...current, phase: "rest", secondsLeft: 15 };
        }

        if (current.phase === "rest") {
          return { ...current, phase: "exercise", secondsLeft: 45, currentIndex: current.currentIndex + 1 };
        }

        return current;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timer.phase, timer.paused, timerSequence]);

  useEffect(() => {
    const key = `${timer.phase}-${timer.secondsLeft}-${timer.currentIndex}-${timer.paused}`;
    if (previousTickRef.current === key) return;
    previousTickRef.current = key;

    if (timer.paused) return;
    if (!["prep", "exercise", "rest"].includes(timer.phase)) return;
    if (![1, 2, 3].includes(timer.secondsLeft)) return;

    const volumeMap: Record<number, number> = { 3: 0.5, 2: 0.75, 1: 1 };
    try {
      const ContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!ContextClass) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new ContextClass();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = timer.phase === "rest" ? "triangle" : "sine";
      oscillator.frequency.value = timer.phase === "rest" ? 740 : 880;
      gain.gain.value = volumeMap[timer.secondsLeft] ?? 0.6;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore audio limitations
    }
  }, [timer]);

  const streak = useMemo(() => calculateStreak(records), [records]);
  const selectedDateInfo = useMemo(() => formatLongDate(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const monthGrid = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const monthRecords = useMemo(() => {
    const prefix = formatDateKey(currentMonth).slice(0, 7);
    return Object.entries(records)
      .filter(([dateKey, value]) => dateKey.startsWith(prefix) && hasDayContent(value))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [records, currentMonth]);
  const selectedWorkoutList = musculacaoExercises[selectedWorkoutSheet];
  const selectedAbsList = absExercises[selectedAbsSheet];
  const timerExercises = absExercises[timerSequence];
  const currentTimerExercise = timerExercises[Math.min(timer.currentIndex, timerExercises.length - 1)];

  const weightForBmi = toNumber(profile.peso);
  const heightForBmi = toNumber(profile.altura);
  const bmi =
    Number.isFinite(weightForBmi) && Number.isFinite(heightForBmi) && weightForBmi > 0 && heightForBmi > 0
      ? weightForBmi / Math.pow(heightForBmi / 100, 2)
      : null;
  const bmiInfo = getBmiInfo(bmi);
  const bodyFat = getBodyFatResult(profile);
  const bodyFatInfo = getBodyFatInfo(bodyFat, profile.sexo);
  const tmb = getTmb(profile);
  const tdee = getTdee(profile);

  function refreshRecords() {
    setRecords(loadAllDayRecords());
  }

  function handleDaySave() {
    saveDayRecord(selectedDate, dayDraft);
    refreshRecords();
    if (dayDraft.abs) setTimerSequence(dayDraft.abs);
  }

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey);
    setCurrentMonth(new Date(parseDateKey(dateKey).getFullYear(), parseDateKey(dateKey).getMonth(), 1, 12));
    setScreen("today");
  }

  function handleProfileCalc() {
    saveProfile(profile);
  }

  function handleSuggestGoals() {
    if (tdee === null) return;
    const peso = toNumber(profile.peso);
    const nextGoals = {
      kcal: String(Math.round(tdee * 0.85)),
      prot: Number.isFinite(peso) && peso > 0 ? String(Math.round(peso * 1.8)) : "",
    };
    setGoals(nextGoals);
    saveGoals(nextGoals);
  }

  function handleSaveNutrition() {
    saveNutritionRecord(selectedDate, nutritionDraft);
  }

  function timerProgress() {
    if (timer.phase === "ready") return 0;
    if (timer.phase === "done") return 100;
    const total = timer.phase === "prep" ? 3 : timer.phase === "exercise" ? 45 : 15;
    return ((total - timer.secondsLeft) / total) * 100;
  }

  function timerTag() {
    if (timer.phase === "ready") return "PRONTO";
    if (timer.phase === "prep") return "PREP";
    if (timer.phase === "exercise") return "EXERCÍCIO";
    if (timer.phase === "rest") return "DESCANSO";
    return "CONCLUÍDO";
  }

  function handleStartTimer() {
    setTimer({ phase: "prep", secondsLeft: 3, currentIndex: 0, paused: false });
  }

  function handlePauseResume() {
    if (!["prep", "exercise", "rest"].includes(timer.phase)) return;
    setTimer((current) => ({ ...current, paused: !current.paused }));
  }

  function handleStopTimer() {
    setTimer(defaultTimer());
  }

  function buildMonthlyTextExport() {
    const lines: string[] = [];
    lines.push(`Diário de Treino - ${formatDateKey(currentMonth).slice(0, 7)}`);
    lines.push("");
    lines.push("FICHAS DE MUSCULAÇÃO");
    (Object.keys(musculacaoExercises) as Array<keyof typeof musculacaoExercises>).forEach((key) => {
      lines.push(`Treino ${key} - ${muscleLabels[key]}`);
      musculacaoExercises[key].forEach((exercise, index) => {
        lines.push(`${index + 1}. ${exercise.name}`);
      });
      lines.push("");
    });
    lines.push("FICHAS DE ABS");
    (Object.keys(absExercises) as Array<keyof typeof absExercises>).forEach((key) => {
      lines.push(`${key} - ${absLabels[key]}`);
      absExercises[key].forEach((exercise, index) => {
        lines.push(`${index + 1}. ${exercise.name}`);
      });
      lines.push("");
    });
    lines.push("REGISTROS DIÁRIOS");
    if (monthRecords.length === 0) {
      lines.push("Nenhum registro no mês.");
    } else {
      monthRecords.forEach(([dateKey, record]) => {
        lines.push(`${dateKey}: ${describeWorkout(record.treino)} / ${describeAbs(record.abs)} / ${record.weight ? `${record.weight}kg` : "sem peso"}`);
        if (record.notes) lines.push(`  Notas: ${record.notes}`);
      });
    }
    return lines.join("\n");
  }

  function handleExportTxt() {
    const content = buildMonthlyTextExport();
    setExportContent(content);
    downloadText(`treinos-${formatDateKey(currentMonth).slice(0, 7)}.txt`, content);
    setShowExport(true);
  }

  function handleExportJson() {
    const data = Object.fromEntries(monthRecords);
    const content = JSON.stringify(data, null, 2);
    setExportContent(content);
    downloadText(
      `diariotreino-backup-${formatDateKey(currentMonth).slice(0, 7)}.json`,
      content,
      "application/json;charset=utf-8"
    );
    setShowExport(true);
  }

  async function handleImportJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, DayRecord>;
      Object.entries(parsed).forEach(([dateKey, value]) => {
        saveDayRecord(dateKey, {
          treino: value?.treino ?? "",
          abs: value?.abs ?? "",
          weight: value?.weight ?? "",
          notes: value?.notes ?? "",
        });
      });
      refreshRecords();
      setDayDraft(loadDayRecord(selectedDate));
      setExportContent(text);
      setShowExport(true);
    } catch {
      // ignore import error
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%),linear-gradient(180deg,#030712_0%,#020617_45%,#010204_100%)] text-slate-100">
      <div className="mx-auto max-w-[480px] px-3 pb-28 pt-20">
        <header className="fixed left-1/2 top-0 z-40 w-full max-w-[480px] -translate-x-1/2 border-b border-white/8 bg-slate-950/92 px-3 py-3.5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Diário de Treino</h1>
              <p className="mt-0.5 text-[11px] text-slate-400">Rotina e progresso</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/12 to-emerald-500/5 px-3.5 py-2 shadow-[0_0_18px_rgba(34,197,94,0.1)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Streak</p>
              <p className="mt-0.5 font-mono text-base font-bold text-emerald-200">{streak}d</p>
            </div>
          </div>
        </header>

        <div className="space-y-3.5">
          {screen === "today" ? (
            <section className="space-y-3.5">
              <div className="app-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-sky-300">{selectedDateInfo.weekday}</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-white">{selectedDateInfo.dayMonth}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {setScreen("calendar"); setShowCalendarDetail(false);}}
                    className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition-all active:scale-95 hover:border-sky-300/40"
                  >
                    Calendário
                  </button>
                </div>
              </div>

              <div className="app-card space-y-3.5">
                <SectionTitle title="Registro rápido" subtitle="Salve treino, ABS e peso do dia" />
                <div className="grid grid-cols-5 gap-2">
                  {(["A", "B", "C", "D", "Off"] as WorkoutKey[]).map((key) => (
                    <QuickActionButton
                      key={key}
                      label={key}
                      active={dayDraft.treino === key}
                      onClick={() => setDayDraft((current) => ({ ...current, treino: current.treino === key ? "" : key }))}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["ABS1", "ABS2", "ABS3"] as AbsKey[]).map((key) => (
                    <QuickActionButton
                      key={key}
                      label={key.replace("ABS", "ABS ")}
                      active={dayDraft.abs === key}
                      onClick={() => {
                        setDayDraft((current) => ({ ...current, abs: current.abs === key ? "" : key }));
                        if (key) setTimerSequence(key);
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label">
                    <span className="text-xs">Peso (kg)</span>
                    <input
                      className="field-input text-base"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="72.5"
                      value={dayDraft.weight}
                      onChange={(event) => setDayDraft((current) => ({ ...current, weight: event.target.value }))}
                    />
                  </label>
                  <div className="flex flex-col justify-end">
                    <button type="button" onClick={handleDaySave} className="primary-button h-[46px] text-sm font-semibold">
                      SALVAR DIA
                    </button>
                  </div>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-slate-400 transition hover:text-slate-300">
                    + Adicionar observações
                  </summary>
                  <textarea
                    className="field-input mt-2.5 min-h-24 resize-none text-sm"
                    placeholder="Supino 10kg/lado x 9/8/7, joelho ok..."
                    value={dayDraft.notes}
                    onChange={(event) => setDayDraft((current) => ({ ...current, notes: event.target.value }))}
                  />
                </details>
              </div>

              <div className="app-card space-y-4">
                <div className="flex items-center justify-between">
                  <SectionTitle title="Timer ABS" subtitle={`${absLabels[timerSequence]} · ${Math.min(timer.currentIndex + 1, timerExercises.length)} de ${timerExercises.length}`} />
                  <select
                    value={timerSequence}
                    onChange={(event) => {
                      const value = event.target.value as Exclude<AbsKey, "">;
                      setTimerSequence(value);
                      setTimer(defaultTimer());
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white"
                  >
                    <option value="ABS1">ABS 1</option>
                    <option value="ABS2">ABS 2</option>
                    <option value="ABS3">ABS 3</option>
                  </select>
                </div>

                <div className="flex flex-col items-center gap-4 py-2">
                  <div
                    className="relative flex h-52 w-52 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/90 shadow-[0_0_50px_rgba(15,23,42,0.6),inset_0_2px_20px_rgba(0,0,0,0.4)]"
                    style={ringGradient(
                      timerProgress(),
                      timer.phase === "rest" ? ["#eab308", "#fef08a"] : ["#22c55e", "#86efac"]
                    )}
                  >
                    <div className="absolute inset-[14px] rounded-full bg-gradient-to-br from-slate-950 to-slate-900 ring-1 ring-white/5" />
                    <div className="relative z-10 text-center">
                      <p className="font-mono text-5xl font-bold tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {timer.phase === "done" ? "00:00" : formatTimer(timer.secondsLeft)}
                      </p>
                      <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-100 backdrop-blur-sm">
                        {timerTag()}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-sm font-medium text-white">
                    {currentTimerExercise?.name ?? "Sequência finalizada"}
                  </p>

                  <div className="grid w-full grid-cols-3 gap-2">
                    <button type="button" onClick={handleStartTimer} className="primary-button py-3 text-sm font-bold">
                      INICIAR
                    </button>
                    <button type="button" onClick={handlePauseResume} className="secondary-button py-3 text-sm font-bold">
                      {timer.paused ? "▶" : "❚❚"}
                    </button>
                    <button type="button" onClick={handleStopTimer} className="secondary-button border-orange-400/25 py-3 text-sm font-bold text-orange-100 hover:border-orange-300/40 hover:bg-orange-400/10">
                      ■
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {screen === "calendar" ? (
            <section className="space-y-3.5">
              <div className="app-card space-y-4">
                <SectionTitle title="Semana" subtitle="Toque em um dia para editar" />
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const record = records[dateKey];
                    const isToday = dateKey === formatDateKey(TODAY);
                    const hasContent = hasDayContent(record);
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => handleSelectDate(dateKey)}
                        className={`rounded-2xl border p-2.5 text-center transition-all active:scale-95 ${
                          isToday
                            ? "border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 shadow-[0_0_20px_rgba(34,197,94,0.14)]"
                            : hasContent
                              ? "border-white/15 bg-white/[0.06]"
                              : "border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{getWeekdayShort(date)}</p>
                        <p className="mt-1.5 text-base font-bold text-white">{date.getDate()}</p>
                        {record?.treino && <div className="mt-2 text-[11px] font-semibold text-emerald-300">{record.treino}</div>}
                        {record?.abs && <div className="mt-0.5 text-[9px] text-sky-300">{record.abs}</div>}
                      </button>
                    );
                  })}</div>
              </div>

              <button
                type="button"
                onClick={() => setShowCalendarDetail(!showCalendarDetail)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-all active:scale-98 hover:border-white/20 hover:bg-white/8"
              >
                {showCalendarDetail ? "◀ Voltar para semana" : "Ver mês completo ▶"}
              </button>

              {showCalendarDetail ? (
                <>
                  <div className="app-card space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}
                        className="secondary-button w-10 px-0 py-2"
                      >
                        ◀
                      </button>
                      <h3 className="text-center text-base font-bold tracking-tight text-white">{getMonthName(currentMonth)}</h3>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}
                        className="secondary-button w-10 px-0 py-2"
                      >
                        ▶
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => (
                        <div key={`${label}-${index}`}>{label}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {monthGrid.map((date) => {
                        const dateKey = formatDateKey(date);
                        const record = records[dateKey];
                        const inMonth = date.getMonth() === currentMonth.getMonth();
                        const isToday = dateKey === formatDateKey(TODAY);
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => handleSelectDate(dateKey)}
                            className={`min-h-16 rounded-xl border p-1.5 text-center transition-all active:scale-95 ${
                              inMonth ? "bg-white/[0.04]" : "bg-white/[0.01] opacity-40"
                            } ${isToday ? "border-slate-200/30 ring-1 ring-emerald-400/20" : "border-white/8"}`}
                          >
                            <p className="text-xs font-bold text-white">{date.getDate()}</p>
                            {record?.treino && <div className="mt-1 text-[10px] font-semibold text-emerald-300">{record.treino}</div>}
                            {record?.abs && <div className="text-[8px] text-sky-300">{record.abs}</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExport(!showExport)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-all active:scale-98 hover:border-white/20 hover:bg-white/8"
                  >
                    {showExport ? "Ocultar exportação" : "Exportar / Importar"}
                  </button>

                  {showExport ? (
                    <div className="app-card space-y-3">
                      <SectionTitle title="Backup" subtitle="Exporte ou importe seus dados" />
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={handleExportTxt} className="secondary-button py-2.5 text-xs">
                          TXT
                        </button>
                        <button type="button" onClick={handleExportJson} className="secondary-button py-2.5 text-xs">
                          JSON
                        </button>
                        <button type="button" onClick={() => importRef.current?.click()} className="secondary-button py-2.5 text-xs">
                          Importar
                        </button>
                      </div>
                      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={handleImportJson} />
                      {exportContent && (
                        <textarea
                          className="field-input min-h-40 resize-none font-mono text-[10px] leading-relaxed"
                          value={exportContent}
                          readOnly
                        />
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : null}

          {screen === "sheets" ? (
            <section className="space-y-3.5">
              <div className="app-card space-y-3.5">
                <SectionTitle title="Fichas" subtitle="Consulte exercícios e instruções" />
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => setSheetTab("musculacao")}
                    className={`pill-button ${sheetTab === "musculacao" ? "pill-active" : "pill-inactive"}`}
                  >
                    Musculação
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetTab("abs")}
                    className={`pill-button ${sheetTab === "abs" ? "pill-active" : "pill-inactive"}`}
                  >
                    ABS
                  </button>
                </div>
              </div>

              {sheetTab === "musculacao" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B", "C", "D"] as Array<Exclude<WorkoutKey, "" | "Off">>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedWorkoutSheet(key);
                          setSelectedWorkoutExercise(0);
                        }}
                        className={`rounded-2xl border p-3.5 text-left transition-all active:scale-95 ${
                          selectedWorkoutSheet === key
                            ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/12 to-emerald-500/5"
                            : "border-white/8 bg-white/[0.03]"
                        }`}
                      >
                        <p className="text-sm font-bold text-white">Treino {key}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{muscleLabels[key]}</p>
                      </button>
                    ))}
                  </div>

                  <div className="app-card space-y-3">
                    <SectionTitle title={`Treino ${selectedWorkoutSheet}`} subtitle={muscleLabels[selectedWorkoutSheet]} />
                    <div className="space-y-2">
                      {selectedWorkoutList.map((exercise, index) => (
                        <button
                          key={exercise.name}
                          type="button"
                          onClick={() => setSelectedWorkoutExercise(index)}
                          className={`w-full rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                            selectedWorkoutExercise === index
                              ? "border-sky-400/35 bg-gradient-to-br from-sky-400/10 to-sky-400/5"
                              : "border-white/8 bg-white/[0.02]"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{index + 1}. {exercise.name}</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{exercise.summary}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="app-card space-y-3">
                    <SectionTitle title="Como fazer" subtitle={selectedWorkoutList[selectedWorkoutExercise].name} />
                    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                      {selectedWorkoutList[selectedWorkoutExercise].howTo.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ABS1", "ABS2", "ABS3"] as Array<Exclude<AbsKey, "">>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedAbsSheet(key);
                          setSelectedAbsExercise(0);
                        }}
                        className={`rounded-2xl border px-3 py-4 text-center transition-all active:scale-95 ${
                          selectedAbsSheet === key
                            ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/12 to-emerald-500/5"
                            : "border-white/8 bg-white/[0.03]"
                        }`}
                      >
                        <p className="text-sm font-bold text-white">{key.replace("ABS", "ABS ")}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{absLabels[key]}</p>
                      </button>
                    ))}
                  </div>

                  <div className="app-card space-y-3">
                    <SectionTitle title={selectedAbsSheet.replace("ABS", "ABS ")} subtitle={absLabels[selectedAbsSheet]} />
                    <div className="space-y-2">
                      {selectedAbsList.map((exercise, index) => (
                        <button
                          key={exercise.name}
                          type="button"
                          onClick={() => setSelectedAbsExercise(index)}
                          className={`w-full rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                            selectedAbsExercise === index
                              ? "border-sky-400/35 bg-gradient-to-br from-sky-400/10 to-sky-400/5"
                              : "border-white/8 bg-white/[0.02]"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{index + 1}. {exercise.name}</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{exercise.summary}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="app-card space-y-3">
                    <SectionTitle title="Como fazer" subtitle={selectedAbsList[selectedAbsExercise].name} />
                    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                      {selectedAbsList[selectedAbsExercise].howTo.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {screen === "scale" ? (
            <section className="space-y-3.5">
              <div className="app-card space-y-4">
                <SectionTitle title="Perfil" subtitle="Preencha para calcular indicadores" />
                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label col-span-2">
                    <span className="text-xs">Sexo</span>
                    <select className="field-input text-base" value={profile.sexo} onChange={(event) => setProfile((current) => ({ ...current, sexo: event.target.value as Sex }))}>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Idade</span>
                    <input className="field-input text-base" type="number" value={profile.idade} onChange={(event) => setProfile((current) => ({ ...current, idade: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Altura (cm)</span>
                    <input className="field-input text-base" type="number" value={profile.altura} onChange={(event) => setProfile((current) => ({ ...current, altura: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Peso (kg)</span>
                    <input className="field-input text-base" type="number" step="0.1" value={profile.peso} onChange={(event) => setProfile((current) => ({ ...current, peso: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Cintura (cm)</span>
                    <input className="field-input text-base" type="number" step="0.1" value={profile.cintura} onChange={(event) => setProfile((current) => ({ ...current, cintura: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Pescoço (cm)</span>
                    <input className="field-input text-base" type="number" step="0.1" value={profile.pescoco} onChange={(event) => setProfile((current) => ({ ...current, pescoco: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Quadril (cm)</span>
                    <input className="field-input text-base" type="number" step="0.1" value={profile.quadril} onChange={(event) => setProfile((current) => ({ ...current, quadril: event.target.value }))} />
                  </label>
                  <label className="field-label col-span-2">
                    <span className="text-xs">Nível de atividade</span>
                    <select className="field-input text-base" value={profile.atividade} onChange={(event) => setProfile((current) => ({ ...current, atividade: event.target.value as ActivityFactor }))}>
                      <option value="1.2">Sedentário</option>
                      <option value="1.375">Leve</option>
                      <option value="1.55">Moderado</option>
                      <option value="1.725">Alto</option>
                    </select>
                  </label>
                </div>
                <button type="button" onClick={handleProfileCalc} className="primary-button w-full py-3 text-sm font-bold">
                  CALCULAR
                </button>
              </div>

              <div className="app-card space-y-4">
                <SectionTitle title="Indicadores" />
                <div className="grid grid-cols-[130px_1fr] gap-4 max-sm:grid-cols-1">
                  <div className="mx-auto flex flex-col items-center gap-2.5">
                    <div
                      className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-slate-950 to-slate-900"
                      style={ringGradient(bmiInfo.progress, bmiInfo.colors)}
                    >
                      <div className="absolute inset-[12px] rounded-full bg-gradient-to-br from-slate-950 to-slate-900/95 ring-1 ring-white/5" />
                      <div className="relative z-10 text-center">
                        <p className="font-mono text-2xl font-bold text-white">{bmi !== null ? bmi.toFixed(1) : "—"}</p>
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-300">IMC</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold ${bmiInfo.tone}`}>
                      {bmiInfo.label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-slate-400">{bmiInfo.explanation}</p>
                    <MetricBox
                      title="% Gordura"
                      value={bodyFat !== null ? `${bodyFat.toFixed(1)}%` : "—"}
                      caption={bodyFatInfo.label + (bodyFatInfo.explanation ? ". " + bodyFatInfo.explanation : "")}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <MetricBox
                        title="TMB"
                        value={tmb !== null ? `${Math.round(tmb)}` : "—"}
                        caption="kcal/dia basal"
                      />
                      <MetricBox
                        title="TDEE"
                        value={tdee !== null ? `${Math.round(tdee)}` : "—"}
                        caption="kcal/dia total"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="app-card space-y-3.5">
                <SectionTitle title="Metas diárias" />
                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label">
                    <span className="text-xs">Calorias (kcal)</span>
                    <input
                      className="field-input text-base"
                      type="number"
                      value={goals.kcal}
                      onChange={(event) => {
                        const next = { ...goals, kcal: event.target.value };
                        setGoals(next);
                        saveGoals(next);
                      }}
                    />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Proteína (g)</span>
                    <input
                      className="field-input text-base"
                      type="number"
                      value={goals.prot}
                      onChange={(event) => {
                        const next = { ...goals, prot: event.target.value };
                        setGoals(next);
                        saveGoals(next);
                      }}
                    />
                  </label>
                </div>
                <button type="button" onClick={handleSuggestGoals} className="secondary-button w-full py-2.5 text-xs font-semibold">
                  Sugerir com base no TDEE (déficit 15%)
                </button>
              </div>

              <div className="app-card space-y-3.5">
                <SectionTitle title="Registro nutricional" subtitle={`Dia ${selectedDate}`} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label">
                    <span className="text-xs">Consumidas (kcal)</span>
                    <input className="field-input text-base" type="number" value={nutritionDraft.kcal} onChange={(event) => setNutritionDraft((current) => ({ ...current, kcal: event.target.value }))} />
                  </label>
                  <label className="field-label">
                    <span className="text-xs">Proteína (g)</span>
                    <input className="field-input text-base" type="number" value={nutritionDraft.prot} onChange={(event) => setNutritionDraft((current) => ({ ...current, prot: event.target.value }))} />
                  </label>
                </div>
                <button type="button" onClick={handleSaveNutrition} className="primary-button w-full py-3 text-sm font-bold">
                  SALVAR NUTRIÇÃO
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-white/8 bg-slate-950/95 px-2 py-2.5 backdrop-blur-2xl">
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              ["today", "Hoje"],
              ["calendar", "Calendário"],
              ["sheets", "Fichas"],
              ["scale", "Balança"],
            ] as Array<[Screen, string]>
          ).map(([value, label]) => {
            const active = screen === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScreen(value)}
                className={`rounded-2xl border px-2 py-2.5 transition-all active:scale-95 ${
                  active
                    ? "border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 shadow-[0_0_18px_rgba(34,197,94,0.12)]"
                    : "border-transparent bg-transparent"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <AppIcon type={value} />
                  <span className={`text-[10px] font-semibold ${active ? "text-emerald-200" : "text-slate-500"}`}>{label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
