export type QueueStatus = 'em_espera' | 'em_corte' | 'concluido' | 'no_show';

export interface Barbearia {
    id: string;
    nome: string;
    endereco: string;
    telefone: string;
    created_at: string;
}

export interface Servico {
    id: string;
    barbearia_id: string;
    nome: string;
    duracao_media: number; // minutes
    preco: number;
    created_at: string;
}

export interface FilaVirtual {
    id: string;
    barbearia_id: string;
    servico_id: string;
    cliente_nome: string;
    cliente_telefone: string;
    status: QueueStatus;
    posicao: number;
    tempo_espera_estimado: number; // minutes
    deposito_pago: boolean;
    deposito_id: string | null;
    created_at: string;
    chamado_at: string | null;
    concluido_at: string | null;
}

export interface QueueEntry extends FilaVirtual {
    servico: Servico;
}
