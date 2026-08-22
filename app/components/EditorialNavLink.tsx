"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalEditorialAccess } from "../lib/civic-ledger";

export function EditorialNavLink() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("utopia.civicSession")) return;
    let active = true;
    void getLocalEditorialAccess()
      .then(() => {
        if (active) setAuthorized(true);
      })
      .catch(() => {
        if (active) setAuthorized(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return authorized ? <Link href="/editorial">Editorial Studio</Link> : null;
}
