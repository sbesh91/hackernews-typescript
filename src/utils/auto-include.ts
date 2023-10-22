import { FieldNode, GraphQLResolveInfo } from "graphql";

type IterateResponse = {
  name: string;
  names: Array<IterateResponse> | null;
};
function getFieldNodeTree(info: GraphQLResolveInfo) {
  const result = info.fieldNodes.flatMap((field) => iterate(field));

  function iterate(field: FieldNode): IterateResponse {
    const set = field.selectionSet?.selections.filter(
      (value) => (value as FieldNode).selectionSet
    );

    const names = set?.flatMap((value) => iterate(value as FieldNode));

    return {
      name: field.name.value,
      names: names && names.length > 0 ? names : null,
    };
  }

  return result;
}

export function getAsIncludes(
  info: GraphQLResolveInfo,
  ignore: Set<string>
): Record<string, any> {
  const result = iterate(getFieldNodeTree(info));

  function iterate(ir: IterateResponse[]) {
    return ir.reduce<Record<string, any>>((prev, { name, names }) => {
      const hasNames = names && names?.length > 0;

      if (ignore.has(name) && hasNames) {
        prev = iterate(names);
      } else if (hasNames) {
        prev[name] = {
          include: iterate(names),
        };
      } else {
        prev[name] = true;
      }

      return prev;
    }, {});
  }

  return result;
}
