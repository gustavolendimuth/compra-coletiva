#!/bin/bash

# Script para aplicar fix financeiro na Railway
# Uso: ./railway-fix.sh [validate|fix|validate-after]

set -e  # Exit on error

echo "🚀 Railway Financial Fix Script"
echo "================================"
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não está instalado."
    echo ""
    echo "Instale com: npm i -g @railway/cli"
    echo "Depois execute: railway login && railway link"
    exit 1
fi

# Verificar se está linkado ao projeto
if ! railway status &> /dev/null; then
    echo "❌ Projeto Railway não está linkado."
    echo ""
    echo "Execute: railway link"
    exit 1
fi

echo "✅ Railway CLI configurado corretamente"
echo ""

# Função para validar
validate() {
    echo "📊 Validando campanhas..."
    echo ""
    railway run node scripts/validate-financial-integrity.js
}

# Função para recalcular
fix() {
    echo "⚠️  ATENÇÃO: Você está prestes a recalcular TODAS as campanhas!"
    echo ""
    echo "Isso vai atualizar os valores de shippingFee e total em todos os pedidos."
    echo ""
    read -p "Você criou um backup do banco? (sim/não): " backup

    if [ "$backup" != "sim" ]; then
        echo ""
        echo "❌ Por favor, crie um backup antes de continuar:"
        echo "   1. Acesse Railway Console"
        echo "   2. Vá em Data → PostgreSQL → Backups"
        echo "   3. Crie um backup manual"
        echo ""
        exit 1
    fi

    echo ""
    read -p "Tem certeza que deseja continuar? (sim/não): " confirm

    if [ "$confirm" != "sim" ]; then
        echo ""
        echo "❌ Operação cancelada."
        exit 0
    fi

    echo ""
    echo "🔧 Recalculando campanhas..."
    echo ""
    railway run node scripts/recalculate-all-campaigns.js

    echo ""
    echo "✅ Recalculação concluída!"
    echo ""
    echo "Execute './railway-fix.sh validate-after' para confirmar que tudo está OK"
}

# Função para validar após fix
validate_after() {
    echo "📊 Validando campanhas após o fix..."
    echo ""
    railway run node scripts/validate-financial-integrity.js
    echo ""
    echo "🎯 Se todas as campanhas passaram (Failed: 0), o fix foi aplicado com sucesso! 🎉"
}

# Main
case "$1" in
    validate)
        validate
        ;;
    fix)
        fix
        ;;
    validate-after)
        validate_after
        ;;
    *)
        echo "Uso: $0 [validate|fix|validate-after]"
        echo ""
        echo "Comandos:"
        echo "  validate        - Valida estado atual das campanhas (antes do fix)"
        echo "  fix             - Recalcula todas as campanhas (aplica o fix)"
        echo "  validate-after  - Valida após o fix (confirma que tudo está OK)"
        echo ""
        echo "Fluxo recomendado:"
        echo "  1. ./railway-fix.sh validate         # Ver quais campanhas têm erro"
        echo "  2. Criar backup no Railway Console"
        echo "  3. ./railway-fix.sh fix              # Aplicar fix"
        echo "  4. ./railway-fix.sh validate-after   # Confirmar sucesso"
        echo ""
        exit 1
        ;;
esac
