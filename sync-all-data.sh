#!/bin/bash

# Script para sincronizar TODOS os sorteios desde 2015 até hoje
# Para todas as loterias: Mega-Sena, Quina, Lotofácil e Lotomania

echo "🚀 Iniciando sincronização completa de dados históricos..."
echo "📅 Período: 2015 até hoje"
echo ""

API_URL="http://localhost:3000/lottery"

# Função para sincronizar uma loteria
sync_lottery() {
    local lottery=$1
    local name=$2
    
    echo "📊 Sincronizando $name..."
    
    response=$(curl -s -X POST "$API_URL/sync" \
        -H "Content-Type: application/json" \
        -d "{
            \"lotteryType\": \"$lottery\",
            \"lastN\": 2000
        }")
    
    if [ $? -eq 0 ]; then
        echo "✅ $name sincronizada com sucesso!"
        echo "   Resposta: $response"
    else
        echo "❌ Erro ao sincronizar $name"
    fi
    echo ""
}

# Sincronizar todas as loterias
echo "═══════════════════════════════════════════════"
echo "  SINCRONIZAÇÃO DE DADOS HISTÓRICOS"
echo "═══════════════════════════════════════════════"
echo ""

sync_lottery "megasena" "Mega-Sena"
sleep 2

sync_lottery "quina" "Quina"
sleep 2

sync_lottery "lotofacil" "Lotofácil"
sleep 2

sync_lottery "lotomania" "Lotomania"
sleep 2

echo "═══════════════════════════════════════════════"
echo "✅ SINCRONIZAÇÃO COMPLETA!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📊 Verificando dados no banco..."
echo ""

# Verificar quantos registros foram inseridos
mysql -h localhost -u lotomind -plotomind123 lotomind -e "
SELECT 
    lt.name as Loteria,
    COUNT(d.id) as Total_Sorteios,
    MIN(d.concurso) as Primeiro_Concurso,
    MAX(d.concurso) as Ultimo_Concurso,
    MIN(d.draw_date) as Primeira_Data,
    MAX(d.draw_date) as Ultima_Data
FROM lottery_types lt
LEFT JOIN draws d ON lt.id = d.lottery_type_id
GROUP BY lt.id, lt.name
ORDER BY lt.name;
"

echo ""
echo "🎉 Dados prontos para gerar predições!"
