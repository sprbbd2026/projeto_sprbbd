import { localizacaoService } from '../services/localizacaoService'
import type { Localizacao } from '../types/localizacao'

export async function fetchHistoricoForSatellite(
  sateliteId: string,
  dataInicio: string,
  dataFim: string,
  limit = 1000,
): Promise<{ pontos: Localizacao[]; demo: boolean }> {
  let resultado: Localizacao[] = []

  try {
    const data = await localizacaoService.getHistoricoTs1({
      satelite_id: sateliteId,
      data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
      data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
      limit,
    })
    if (data.length > 0) resultado = data
  } catch {
    /* TS1 indisponível */
  }

  if (resultado.length === 0) {
    try {
      resultado = await localizacaoService.getHistorico({
        satelite_id: sateliteId,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
        limit,
      })
    } catch {
      /* TS2 indisponível ou sem dados */
    }
  }

  return { pontos: resultado, demo: false }
}
