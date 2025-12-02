#!/bin/bash

# Test Lottery API Integration
# This script tests fetching real data from Caixa API

echo "🧪 Testing Lottery API Integration"
echo "===================================="
echo ""

# Test Mega-Sena API
echo "Testing Mega-Sena API..."
response=$(curl -s "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/")

if echo "$response" | jq . > /dev/null 2>&1; then
    concurso=$(echo "$response" | jq -r '.numero')
    data=$(echo "$response" | jq -r '.dataApuracao')
    numeros=$(echo "$response" | jq -r '.listaDezenas | join(", ")')
    
    echo "✓ Mega-Sena API is working!"
    echo "  Concurso: $concurso"
    echo "  Data: $data"
    echo "  Números: $numeros"
else
    echo "✗ Mega-Sena API failed"
    echo "Response: $response"
fi

echo ""

# Test Quina API
echo "Testing Quina API..."
response=$(curl -s "https://servicebus2.caixa.gov.br/portaldeloterias/api/quina/")

if echo "$response" | jq . > /dev/null 2>&1; then
    concurso=$(echo "$response" | jq -r '.numero')
    echo "✓ Quina API is working! (Concurso: $concurso)"
else
    echo "✗ Quina API failed"
fi

echo ""

# Test Lotofácil API
echo "Testing Lotofácil API..."
response=$(curl -s "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/")

if echo "$response" | jq . > /dev/null 2>&1; then
    concurso=$(echo "$response" | jq -r '.numero')
    echo "✓ Lotofácil API is working! (Concurso: $concurso)"
else
    echo "✗ Lotofácil API failed"
fi

echo ""
echo "===================================="
echo "API Integration Test Complete"
