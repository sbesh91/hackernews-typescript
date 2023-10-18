import { objectType } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.list.nonNull.field("links", {
      type: "Link",
    });
    t.list.nonNull.field("votes", {
      type: "Link",
    });
  },
});
