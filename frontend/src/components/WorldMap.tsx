import { useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { motion, useReducedMotion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { PaisIntensidade } from '../types/mapa'

const GEO_URL = '/world-110m.json'

// Mapa ISO A2 (alpha-2) → ISO N3 (numeric-3)
// Usado para correlacionar os dados da API (ISO A2) com o TopoJSON (ISO N3)
const ISO_A2_TO_N3: Record<string, string> = {
  AF: '004', AX: '008', AL: '008', DZ: '012', AS: '016', AD: '020',
  AO: '024', AI: '660', AQ: '010', AG: '028', AR: '032', AM: '051',
  AW: '533', AU: '036', AT: '040', AZ: '031', BS: '044', BH: '048',
  BD: '050', BB: '052', BY: '112', BE: '056', BZ: '084', BJ: '204',
  BM: '060', BT: '064', BO: '068', BA: '070', BW: '072', BV: '074',
  BR: '076', IO: '086', BN: '096', BG: '100', BF: '854', BI: '108',
  KH: '116', CM: '120', CA: '124', CV: '132', KY: '136', CF: '140',
  TD: '148', CL: '152', CN: '156', CX: '162', CC: '166', CO: '170',
  KM: '174', CG: '178', CD: '180', CK: '184', CR: '188', CI: '384',
  HR: '191', CU: '192', CY: '196', CZ: '203', DK: '208', DJ: '262',
  DM: '212', DO: '214', EC: '218', EG: '818', SV: '222', GQ: '226',
  ER: '232', EE: '233', ET: '231', FK: '238', FO: '234', FJ: '242',
  FI: '246', FR: '250', GF: '254', PF: '258', TF: '260', GA: '266',
  GM: '270', GE: '268', DE: '276', GH: '288', GI: '292', GR: '300',
  GL: '304', GD: '308', GP: '312', GU: '316', GT: '320', GG: '831',
  GN: '324', GW: '624', GY: '328', HT: '332', HM: '334', VA: '336',
  HN: '340', HK: '344', HU: '348', IS: '352', IN: '356', ID: '360',
  IR: '364', IQ: '368', IE: '372', IM: '833', IL: '376', IT: '380',
  JM: '388', JP: '392', JE: '832', JO: '400', KZ: '398', KE: '404',
  KI: '296', KP: '408', KR: '410', KW: '414', KG: '417', LA: '418',
  LV: '428', LB: '422', LS: '426', LR: '430', LY: '434', LI: '438',
  LT: '440', LU: '442', MO: '446', MK: '807', MG: '450', MW: '454',
  MY: '458', MV: '462', ML: '466', MT: '470', MH: '584', MQ: '474',
  MR: '478', MU: '480', YT: '175', MX: '484', FM: '583', MD: '498',
  MC: '492', MN: '496', ME: '499', MS: '500', MA: '504', MZ: '508',
  MM: '104', NA: '516', NR: '520', NP: '524', NL: '528', AN: '530',
  NC: '540', NZ: '554', NI: '558', NE: '562', NG: '566', NU: '570',
  NF: '574', MP: '580', NO: '578', OM: '512', PK: '586', PW: '585',
  PS: '275', PA: '591', PG: '598', PY: '600', PE: '604', PH: '608',
  PN: '612', PL: '616', PT: '620', PR: '630', QA: '634', RE: '638',
  RO: '642', RU: '643', RW: '646', SH: '654', KN: '659', LC: '662',
  PM: '666', VC: '670', WS: '882', SM: '674', ST: '678', SA: '682',
  SN: '686', RS: '688', SC: '690', SL: '694', SG: '702', SK: '703',
  SI: '705', SB: '090', SO: '706', ZA: '710', GS: '239', SS: '728',
  ES: '724', LK: '144', SD: '729', SR: '740', SJ: '744', SZ: '748',
  SE: '752', CH: '756', SY: '760', TW: '158', TJ: '762', TZ: '834',
  TH: '764', TL: '626', TG: '768', TK: '772', TO: '776', TT: '780',
  TN: '788', TR: '792', TM: '795', TC: '796', TV: '798', UG: '800',
  UA: '804', AE: '784', GB: '826', US: '840', UM: '581', UY: '858',
  UZ: '860', VU: '548', VE: '862', VN: '704', VG: '092', VI: '850',
  WF: '876', EH: '732', YE: '887', ZM: '894', ZW: '716',
  XK: '383',
}

const colorScale = scaleLinear<string>()
  .domain([1, 10])
  .range(['#2a2a2a', '#7f1d1d'])
  .clamp(true)

interface TooltipInfo {
  nome: string
  intensidade: number | null
}

interface WorldMapProps {
  paises: PaisIntensidade[]
  onPaisClick: (codigo: string, nome: string) => void
}

export function WorldMap({ paises, onPaisClick }: WorldMapProps) {
  const prefersReduced = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  // Indexa os países por ISO N3 para lookup eficiente
  const intensidadeByN3 = useCallback(() => {
    const map: Record<string, PaisIntensidade> = {}
    for (const pais of paises) {
      const n3 = ISO_A2_TO_N3[pais.codigo_pais.toUpperCase()]
      if (n3) {
        map[n3] = pais
      }
    }
    return map
  }, [paises])()

  function getCountryColor(geoId: string, isHovered: boolean): string {
    if (isHovered) return '#C9B882'
    const pais = intensidadeByN3[geoId]
    if (!pais) return '#2a2a2a'
    return colorScale(pais.intensidade_final)
  }

  return (
    <Tooltip.Provider delayDuration={100}>
      <motion.div
        className="w-full h-full"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReduced ? 0 : 0.5, ease: 'easeOut' }}
      >
        <Tooltip.Root open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <Tooltip.Trigger asChild>
            <div className="w-full h-full">
              <ComposableMap
                projectionConfig={{
                  rotate: [-10, 0, 0],
                  scale: 147,
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoId = String(geo.id)
                      const isHovered = hoveredId === geoId
                      const pais = intensidadeByN3[geoId]
                      const fill = getCountryColor(geoId, isHovered)

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#1a1a1a"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none', cursor: pais ? 'pointer' : 'default' },
                            hover: { outline: 'none', cursor: 'pointer' },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={() => {
                            setHoveredId(geoId)
                            setTooltipInfo({
                              nome: String(geo.properties.name ?? geoId),
                              intensidade: pais?.intensidade_final ?? null,
                            })
                            setTooltipOpen(true)
                          }}
                          onMouseLeave={() => {
                            setHoveredId(null)
                            setTooltipOpen(false)
                          }}
                          onClick={() => {
                            if (pais) {
                              onPaisClick(pais.codigo_pais, pais.nome_pais)
                            }
                          }}
                        />
                      )
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              sideOffset={8}
              className="z-50 rounded-md bg-[#1e1e1e] border border-[#333] px-3 py-2 text-sm text-white shadow-lg"
            >
              {tooltipInfo && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{tooltipInfo.nome}</span>
                  {tooltipInfo.intensidade !== null ? (
                    <span className="text-xs text-[#C9B882]">
                      Intensidade: {tooltipInfo.intensidade}/10
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Sem dados disponíveis</span>
                  )}
                </div>
              )}
              <Tooltip.Arrow className="fill-[#1e1e1e]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </motion.div>
    </Tooltip.Provider>
  )
}
