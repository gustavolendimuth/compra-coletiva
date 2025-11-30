# Debug do Menu Mobile - Checklist

## Problema Reportado
O botão hambúrguer não responde ao clique.

## Checklist de Verificação

### 1. Verificar Tamanho da Tela
- [ ] A largura da tela é **menor que 768px**?
- [ ] O botão hambúrguer está **visível** na tela?
- [ ] Se estiver em desktop, **redimensione a janela** para menos de 768px

**Como verificar:**
1. Abra o DevTools (F12)
2. Clique no ícone de dispositivo móvel (Device Toolbar)
3. Selecione um dispositivo como "iPhone 12" ou defina largura < 768px

### 2. Verificar Console do Navegador
Abra o Console do DevTools e verifique:

- [ ] Ao clicar no hambúrguer, aparece: `HamburgerButton clicked`
- [ ] Logo em seguida aparece: `Menu toggle clicked, current state: false` (ou true)
- [ ] Aparece: `Layout render, isMobileMenuOpen: true` (quando abrir)

**Se NÃO aparecer nenhuma mensagem:**
- O evento de click não está sendo disparado
- Pode haver um elemento sobrepondo o botão

**Se aparecer as mensagens:**
- O click está funcionando
- O problema é visual (CSS/animações)

### 3. Verificar Elementos Visíveis

No navegador, verifique se aparecem:
- [ ] O ícone hambúrguer (três linhas horizontais brancas)
- [ ] O texto "Fechado" ao lado do hambúrguer
- [ ] Quando clicar, o texto muda para "Aberto"
- [ ] As linhas do hambúrguer animam para formar um X

### 4. Teste Temporário - Mostrar em Desktop

Se quiser testar mesmo em desktop (> 768px), edite temporariamente:

```tsx
// Em Layout.tsx, linha 54, remova o md:hidden:
<div className="flex items-center">  {/* removeu md:hidden */}
  <HamburgerButton
    isOpen={isMobileMenuOpen}
    onClick={handleMenuToggle}
  />
```

### 5. Verificar Overlay e Menu

Quando o menu abrir:
- [ ] Aparece um overlay escuro cobrindo a tela
- [ ] O menu desliza da direita para esquerda
- [ ] O menu mostra: Logo, botão X, links de navegação
- [ ] Clicar no overlay ou no X fecha o menu

### 6. Verificar Erros

No Console do DevTools:
- [ ] NÃO aparecem erros em vermelho
- [ ] NÃO aparecem warnings sobre imports faltando

## Solução Rápida

Se nada funcionar, tente:

1. **Hard Refresh:** Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
2. **Limpar Cache:** DevTools > Network > Disable cache
3. **Verificar modo responsivo:** DevTools > Toggle device toolbar

## O que foi implementado

✅ MobileMenu component com full-screen overlay
✅ HamburgerButton com animação
✅ useBodyScrollLock hook
✅ Logs de debug adicionados
✅ Indicador visual de estado (Aberto/Fechado)

## Próximos Passos

Após verificar os itens acima, reporte:
1. O que aparece no Console quando clica
2. Se o texto "Fechado/Aberto" muda
3. Se o hambúrguer está visível em telas < 768px
4. Screenshots se possível
