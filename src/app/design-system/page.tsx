"use client";

import React, { useState } from "react";
import * as Icons from "@/icons";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Avatar from "@/components/ui/avatar/Avatar";
import ComponentCard from "@/components/common/ComponentCard";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Radio from "@/components/form/input/Radio";
import Switch from "@/components/form/switch/Switch";

import PageHeader from "@/components/back-office/PageHeader";
import StatCards from "@/components/back-office/StatCards";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import DefinitionList from "@/components/back-office/DefinitionList";
import { FormCard, ToggleRow } from "@/components/back-office/FormCard";

import { PlusIcon } from "@/icons";
import { dashboardKpis, orders, currency, dateTime, type Order } from "@/lib/mock";

/* ------------------------------------------------------------------ helpers */

const SECTIONS = [
  ["colors", "Colours"],
  ["typography", "Typography"],
  ["buttons", "Buttons"],
  ["badges", "Badges & status"],
  ["alerts", "Alerts"],
  ["avatars", "Avatars"],
  ["forms", "Form controls"],
  ["data", "Data display"],
  ["blocks", "Layout blocks"],
  ["icons", "Icons"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-200 py-12 first:border-0 dark:border-gray-800">
      <h2 className="mb-6 text-title-sm font-bold text-gray-800 dark:text-white/90">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children?: React.ReactNode }) {
  return (
    <div className={children ? "mb-6" : "mb-3"}>
      {label && <p className="mb-2 text-theme-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>}
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="w-24">
      <div
        className="h-14 w-full rounded-lg border border-black/5 dark:border-white/10"
        style={{ background: `var(--color-${token})` }}
      />
      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{token}</p>
    </div>
  );
}

const SHADES = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const scale = (family: string) => SHADES.map((s) => `${family}-${s}`);

/* --------------------------------------------------------------------- page */

export default function DesignSystemPage() {
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("standard");

  const orderColumns: Column<Order>[] = [
    { key: "number", header: "Order" },
    { key: "customer", header: "Customer" },
    { key: "date", header: "Date", render: (o) => dateTime(o.date) },
    { key: "total", header: "Total", align: "right", render: (o) => currency(o.total) },
    { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
  ];

  const iconEntries = Object.entries(Icons).filter(
    ([, C]) => typeof C === "function" || (C && typeof C === "object"),
  ) as [string, React.FC<React.SVGProps<SVGSVGElement>>][];

  return (
    <div>
      <p className="mb-8 max-w-2xl text-theme-sm text-gray-500 dark:text-gray-400">
        Every component and token used across the back office, on one page. Built on the TailAdmin
        template; front-end only. Toggle light / dark in the header to check both themes.
      </p>

      {/* in-page nav */}
      <nav className="mb-4 flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* COLOURS */}
      <Section id="colors" title="Colours">
        {[
          ["Brand", "brand"],
          ["Gray", "gray"],
          ["Success", "success"],
          ["Warning", "warning"],
          ["Error", "error"],
          ["Blue light", "blue-light"],
          ["Orange", "orange"],
        ].map(([label, family]) => (
          <Row key={family} label={label}>
            {scale(family).map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </Row>
        ))}
      </Section>

      {/* TYPOGRAPHY */}
      <Section id="typography" title="Typography">
        <div className="space-y-3">
          <p className="text-title-2xl font-bold">Title 2xl — 72 / 90</p>
          <p className="text-title-xl font-bold">Title xl — 60 / 72</p>
          <p className="text-title-lg font-bold">Title lg — 48 / 60</p>
          <p className="text-title-md font-bold">Title md — 36 / 44</p>
          <p className="text-title-sm font-bold">Title sm — 30 / 38</p>
          <p className="text-theme-xl">Theme xl — 20 / 30</p>
          <p className="text-base">Base — 16 / 24</p>
          <p className="text-theme-sm">Theme sm — 14 / 20</p>
          <p className="text-theme-xs">Theme xs — 12 / 18</p>
          <div className="flex gap-6 pt-2 text-theme-sm">
            <span className="font-normal">Normal 400</span>
            <span className="font-medium">Medium 500</span>
            <span className="font-semibold">Semibold 600</span>
            <span className="font-bold">Bold 700</span>
          </div>
        </div>
      </Section>

      {/* BUTTONS */}
      <Section id="buttons" title="Buttons">
        <Row label="Variant">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
        </Row>
        <Row label="Size">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
        </Row>
        <Row label="With icon">
          <Button startIcon={<PlusIcon />}>Add item</Button>
          <Button variant="outline" endIcon={<PlusIcon />}>
            Add item
          </Button>
        </Row>
        <Row label="Disabled">
          <Button disabled>Primary</Button>
          <Button variant="outline" disabled>
            Outline
          </Button>
        </Row>
      </Section>

      {/* BADGES */}
      <Section id="badges" title="Badges & status">
        <Row label="Badge — light">
          {(["primary", "success", "error", "warning", "info", "light", "dark"] as const).map((c) => (
            <Badge key={c} color={c}>
              {c}
            </Badge>
          ))}
        </Row>
        <Row label="Badge — solid">
          {(["primary", "success", "error", "warning", "info", "light", "dark"] as const).map((c) => (
            <Badge key={c} variant="solid" color={c}>
              {c}
            </Badge>
          ))}
        </Row>
        <Row label="StatusBadge (maps mock status strings)">
          {["Active", "Trialing", "Past due", "Churned", "Paid", "Pending", "Refunded", "Published", "Draft", "Archived", "Open", "Overdue", "Succeeded", "Failed"].map(
            (s) => (
              <StatusBadge key={s} value={s} />
            ),
          )}
        </Row>
      </Section>

      {/* ALERTS */}
      <Section id="alerts" title="Alerts">
        <div className="grid gap-4 md:grid-cols-2">
          <Alert variant="success" title="Payment received" message="The invoice was marked as paid." />
          <Alert variant="info" title="New trial started" message="Northpeak began an Enterprise trial." />
          <Alert variant="warning" title="Low stock" message="iPhone 15 Pro Max is down to 7 units." />
          <Alert variant="error" title="Payment failed" message="The card was declined for $498." />
        </div>
      </Section>

      {/* AVATARS */}
      <Section id="avatars" title="Avatars">
        <Row label="Size">
          {(["xsmall", "small", "medium", "large", "xlarge", "xxlarge"] as const).map((s) => (
            <Avatar key={s} src="/images/avatar.png" size={s} />
          ))}
        </Row>
        <Row label="Status">
          <Avatar src="/images/avatar.png" size="large" status="online" />
          <Avatar src="/images/avatar.png" size="large" status="busy" />
          <Avatar src="/images/avatar.png" size="large" status="offline" />
          <Avatar src="/images/avatar.png" size="large" status="none" />
        </Row>
      </Section>

      {/* FORMS */}
      <Section id="forms" title="Form controls">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <Label htmlFor="ds-default">Text input</Label>
              <Input id="ds-default" placeholder="Placeholder text" />
            </div>
            <div>
              <Label htmlFor="ds-success">Success state</Label>
              <Input id="ds-success" defaultValue="looks-good@homonyme.app" success hint="Looks good." />
            </div>
            <div>
              <Label htmlFor="ds-error">Error state</Label>
              <Input id="ds-error" defaultValue="not-an-email" error hint="Enter a valid email." />
            </div>
            <div>
              <Label htmlFor="ds-disabled">Disabled</Label>
              <Input id="ds-disabled" defaultValue="Read only" disabled />
            </div>
            <div>
              <Label>Select</Label>
              <Select
                options={[
                  { value: "free", label: "Free" },
                  { value: "pro", label: "Pro" },
                  { value: "enterprise", label: "Enterprise" },
                ]}
                onChange={() => {}}
                placeholder="Choose a plan"
              />
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <Label>Textarea</Label>
              <TextArea placeholder="Write a note…" rows={4} />
            </div>
            <div>
              <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-400">Checkbox</p>
              <div className="space-y-2">
                <Checkbox checked={checked} onChange={setChecked} label="Email me about product news" />
                <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
                <Checkbox checked={false} onChange={() => {}} label="Disabled" disabled />
              </div>
            </div>
            <div>
              <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-400">Radio</p>
              <div className="flex gap-6">
                <Radio id="r1" name="ship" value="standard" checked={radio === "standard"} onChange={setRadio} label="Standard" />
                <Radio id="r2" name="ship" value="express" checked={radio === "express"} onChange={setRadio} label="Express" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-400">Switch</p>
              <div className="flex gap-6">
                <Switch label="Blue" defaultChecked />
                <Switch label="Gray" color="gray" />
                <Switch label="Disabled" disabled />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* DATA DISPLAY */}
      <Section id="data" title="Data display">
        <Row label="StatCards" />
        <div className="mb-8">
          <StatCards items={dashboardKpis} />
        </div>
        <Row label="DataTable" />
        <div className="mb-8">
          <DataTable columns={orderColumns} rows={orders.slice(0, 5)} rowKey={(o) => o.id} />
        </div>
        <Row label="DefinitionList" />
        <div className="max-w-md">
          <DefinitionList
            title="Order details"
            items={[
              { label: "Status", value: <StatusBadge value="Paid" /> },
              { label: "Payment method", value: "Card" },
              { label: "Total", value: currency(2148) },
            ]}
          />
        </div>
      </Section>

      {/* LAYOUT BLOCKS */}
      <Section id="blocks" title="Layout blocks">
        <Row label="PageHeader" />
        <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
          <PageHeader
            title="Orders"
            description="All orders placed through the storefront and admin."
            action={{ label: "Create order" }}
          />
        </div>
        <Row label="ComponentCard" />
        <div className="mb-8 max-w-lg">
          <ComponentCard title="Card title" desc="Optional description under the title.">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Card body content goes here.</p>
          </ComponentCard>
        </div>
        <Row label="FormCard + ToggleRow" />
        <div className="max-w-lg">
          <FormCard title="Email notifications">
            <ToggleRow label="New order" description="When a customer places an order" on />
            <ToggleRow label="Weekly summary" description="Every Monday morning" />
          </FormCard>
        </div>
      </Section>

      {/* ICONS */}
      <Section id="icons" title="Icons">
        <p className="mb-4 text-theme-sm text-gray-500 dark:text-gray-400">
          {iconEntries.length} icons exported from <code>@/icons</code>.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {iconEntries.map(([name, Icon]) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 text-center dark:border-gray-800"
            >
              <span className="flex h-6 w-6 items-center justify-center text-gray-700 dark:text-gray-300">
                <Icon />
              </span>
              <span className="w-full truncate text-theme-xs text-gray-400" title={name}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
