/**
 * Capitaliza a primeira letra de cada palavra em um nome
 * Exemplo: "joão da silva" -> "João Da Silva"
 * @param name Nome a ser capitalizado
 * @returns Nome com a primeira letra de cada palavra em maiúscula
 */
export const capitalizeName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return name;
  }

  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
