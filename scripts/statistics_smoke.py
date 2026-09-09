"""Phase 10A metadata-only smoke check; it performs no statistical inference."""
from core.statistics.models import *
from core.statistics.serialization import dumps,loads_plan,schema_hash
def main():
 h=HypothesisDefinition("bsda-h","bsda","Do components change under matched attack?","estimation",AnalysisMode.DESCRIPTIVE,ScientificStatus.EMPIRICAL_HYPOTHESIS,"declared future population","matched base cases",provenance={"estimand_id":"bsda-e"})
 e=EstimandDefinition("bsda-e","paired component difference","raw source-native component difference","matched component difference","distance",None,"declared future population","baseline vs attacked")
 plan=StatisticalAnalysisPlan("statistics-smoke","v1","BSDA component plan","metadata only",("bsda",),(h,),(e,),AnalysisUnitDefinition(experimental_unit="base_case",pairing_unit="base_case",resampling_unit="base_case"),GroupingDefinition("base-cases",("base_case_id",),GroupingPurpose.PAIRING),PairingDefinition("matched",PairingStatus.PAIRED,("base_case_id",),("baseline","attacked")),"paired_t_test",ResamplingPlan("resampling",ResamplingMethod.GROUPED_BOOTSTRAP,"base_case",("base_case_id",),"matched"),MultiplicityPlan("multiplicity",None,None,MultiplicityMethod.NONE),EffectSizePlan("effect","paired_difference",raw_scale_effect="raw difference"),MissingnessPlan("missing",{"failed":"summarize","uncalibrated":"retain"}),(),readiness=ReadinessStates(True,True,False,False,False))
 assert loads_plan(dumps(plan))==plan
 artifact=StatisticalExperimentArtifact("statistics-smoke-experiment",plan.plan_id,schema_hash(plan),plan.plan_version,"bsda",plan.readiness,{}, {},{"python":"3.11"},"metadata_created")
 result=StatisticalResultRecord("statistics-smoke-result",artifact.experiment_id,h.hypothesis_id,e.estimand_id,"paired_t_test")
 print({"phase":"10A","mode":"statistical_planning_only","engineering_ready":plan.readiness.engineering_ready,"plan_ready":plan.readiness.plan_ready,"data_ready":plan.readiness.data_ready,"analysis_ready":plan.readiness.analysis_ready,"claim_validated":plan.readiness.claim_validated,"inference_computed":result.result_status is not ResultStatus.NOT_COMPUTED})
if __name__=="__main__": main()
